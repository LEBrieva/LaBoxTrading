"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { parseSimplefxCsv, type ParsedRow } from "@/lib/import/simplefx-csv";

const MAX_ROWS = 2000;

export interface ImportResult {
  imported: number;
  closed: number;
  duplicates: number;
  pending: number;
  errors: { line: number; reason: string }[];
}

export async function importSimplefxTrades(
  accountId: string,
  csvText: string
): Promise<ImportResult> {
  const user = await getUser();
  checkRateLimit(user.id, "importTrades", 5, 60_000);

  // Verify account belongs to user and is SIMPLEFX
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");
  if (account.broker !== "SIMPLEFX") throw new Error("Solo se permite importar en cuentas SimpleFX");

  // Parse CSV
  const parsed = parseSimplefxCsv(csvText);
  const errors = [...parsed.errors];

  if (parsed.rows.length === 0) {
    return { imported: 0, closed: 0, duplicates: 0, pending: parsed.pending, errors };
  }

  if (parsed.rows.length > MAX_ROWS) {
    return {
      imported: 0,
      closed: 0,
      duplicates: 0,
      pending: parsed.pending,
      errors: [{ line: 0, reason: `Demasiadas filas (${parsed.rows.length}). Maximo: ${MAX_ROWS}` }],
    };
  }

  // Batch: get valid symbols for SIMPLEFX
  const uniqueSymbols = [...new Set(parsed.rows.map((r) => r.symbol.toUpperCase()))];
  const dbSymbols = await prisma.symbol.findMany({
    where: { broker: "SIMPLEFX", name: { in: uniqueSymbols } },
    select: { name: true },
  });
  const validSymbols = new Set(dbSymbols.map((s) => s.name));

  // Batch: get existing externalIds from trades AND positions
  const externalIds = parsed.rows.map((r) => r.externalId);
  const [existingTrades, existingPositions] = await Promise.all([
    prisma.trade.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true, status: true },
    }),
    prisma.position.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true },
    }),
  ]);
  const existingTradeMap = new Map(existingTrades.map((t) => [t.externalId, t.status]));
  const existingPositionIds = new Set(existingPositions.map((p) => p.externalId));

  // Batch: get open trades for this account to match partial/full closes
  const openTrades = await prisma.trade.findMany({
    where: { accountId, status: "OPEN" },
    include: { positions: true },
  });

  // Filter rows into: new trades, and rows that could close an open trade
  let duplicates = 0;
  const newRows: ParsedRow[] = [];
  const closeRows: { row: ParsedRow; openTradeId: string; openTradeSize: number; syncOpenedAt: boolean }[] = [];
  const runningSizeByTrade = new Map<string, number>();

  for (const row of parsed.rows) {
    // Check externalId duplicate in trades (CLOSED) or positions
    if (existingPositionIds.has(row.externalId)) {
      duplicates++;
      continue;
    }
    if (existingTradeMap.has(row.externalId)) {
      const status = existingTradeMap.get(row.externalId);
      if (status === "CLOSED") {
        duplicates++;
        continue;
      }
      // OPEN trade with same externalId — will be handled as a close match below
    }

    // Check symbol exists
    if (!validSymbols.has(row.symbol.toUpperCase())) {
      errors.push({ line: 0, reason: `Simbolo no encontrado: ${row.symbol}` });
      continue;
    }

    // Try to match with an open trade:
    // 1. By externalId (most reliable — same broker order)
    // 2. By symbol + direction + entry + same day + prefer matching size
    const sameDay = (a: Date, b: Date) =>
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate();

    const fieldCandidates = openTrades.filter((t) =>
      t.pair === row.symbol.toUpperCase() &&
      t.direction === row.direction &&
      t.entry !== null && Math.abs(t.entry - row.entry) < 0.000001 &&
      sameDay(t.openedAt, row.openedAt)
    );

    // Prefer candidate with matching size (helps when 2 identical trades exist)
    const fieldMatch =
      fieldCandidates.find((t) => {
        const sz = runningSizeByTrade.get(t.id) ?? (t.size ?? 0);
        return Math.abs(sz - row.size) < 0.000001;
      }) ?? fieldCandidates[0] ?? null;

    const matchedTrade =
      openTrades.find((t) => t.externalId === row.externalId) ?? fieldMatch;

    if (matchedTrade) {
      const matchedByExtId = matchedTrade.externalId === row.externalId;
      // Use running size to handle multiple closes for the same trade
      const currentSize = runningSizeByTrade.get(matchedTrade.id) ?? (matchedTrade.size ?? 0);
      closeRows.push({
        row,
        openTradeId: matchedTrade.id,
        openTradeSize: currentSize,
        syncOpenedAt: !matchedByExtId, // sync openedAt when matched by fields (manual trade, imprecise time)
      });
      runningSizeByTrade.set(matchedTrade.id, Math.round((currentSize - row.size) * 1e8) / 1e8);
    } else if (!existingTradeMap.has(row.externalId)) {
      newRows.push(row);
    } else {
      duplicates++;
    }
  }

  if (newRows.length === 0 && closeRows.length === 0) {
    return { imported: 0, closed: 0, duplicates, pending: parsed.pending, errors };
  }

  // Calculate total PnL for capital adjustment
  const totalPnl =
    newRows.reduce((sum, r) => sum + r.pnl, 0) +
    closeRows.reduce((sum, c) => sum + c.row.pnl, 0);

  // Atomic transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create new trades
    for (const row of newRows) {
      await tx.trade.create({
        data: {
          accountId,
          pair: row.symbol.toUpperCase(),
          direction: row.direction,
          entry: row.entry,
          stopLoss: row.stopLoss,
          takeProfit: row.takeProfit,
          size: row.size,
          externalId: row.externalId,
          notes: row.notes,
          openedAt: row.openedAt,
          closedAt: row.closedAt,
          status: "CLOSED",
          riskUsd: 0,
          riskPct: 0,
          positions: {
            create: {
              label: "Posicion 1",
              status: row.positionStatus,
              size: row.size,
              pnl: row.pnl,
              closePrice: row.closePrice,
              closedAt: row.closedAt,
              externalId: row.externalId,
            },
          },
        },
      });
    }

    // 2. Close/partial-close open trades
    for (const { row, openTradeId, openTradeSize, syncOpenedAt } of closeRows) {
      const isPartial = openTradeSize > 0 && row.size < openTradeSize;

      // Sync trade data from broker CSV (more accurate times, SL/TP)
      const tradeSync: Record<string, unknown> = {};
      if (syncOpenedAt) tradeSync.openedAt = row.openedAt;
      if (row.stopLoss != null) tradeSync.stopLoss = row.stopLoss;
      if (row.takeProfit != null) tradeSync.takeProfit = row.takeProfit;

      if (isPartial) {
        const partialPct = (row.size / openTradeSize) * 100;
        const remaining = Math.round((openTradeSize - row.size) * 1e8) / 1e8;

        // Count existing positions to label the new one
        const posCount = await tx.position.count({ where: { tradeId: openTradeId } });

        // Create partial position
        await tx.position.create({
          data: {
            tradeId: openTradeId,
            label: `Posicion ${posCount + 1}`,
            status: "PARTIAL",
            size: row.size,
            pnl: row.pnl,
            closePrice: row.closePrice,
            closedAt: row.closedAt,
            isPartial: true,
            partialPct,
            externalId: row.externalId,
          },
        });

        // Reduce trade size + sync broker data
        await tx.trade.update({
          where: { id: openTradeId },
          data: { size: remaining, ...tradeSync },
        });
      } else {
        // Full close — find the first OPEN position and update it
        const openPosition = await tx.position.findFirst({
          where: { tradeId: openTradeId, status: "OPEN" },
        });

        if (openPosition) {
          await tx.position.update({
            where: { id: openPosition.id },
            data: {
              status: row.positionStatus,
              pnl: row.pnl,
              size: row.size,
              closePrice: row.closePrice,
              closedAt: row.closedAt,
              externalId: row.externalId,
            },
          });

          // Close any remaining OPEN positions
          await tx.position.updateMany({
            where: { tradeId: openTradeId, status: "OPEN" },
            data: {
              status: row.positionStatus,
              pnl: 0,
              closedAt: row.closedAt,
            },
          });
        }

        // Close the trade + sync broker data
        await tx.trade.update({
          where: { id: openTradeId },
          data: {
            status: "CLOSED",
            closedAt: row.closedAt,
            ...tradeSync,
          },
        });
      }
    }

    // 3. Adjust account capital
    if (totalPnl !== 0) {
      await tx.account.update({
        where: { id: accountId },
        data: { currentCapital: { increment: totalPnl } },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/calendar");

  return {
    imported: newRows.length,
    closed: closeRows.length,
    duplicates,
    pending: parsed.pending,
    errors,
  };
}
