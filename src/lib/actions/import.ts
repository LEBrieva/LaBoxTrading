"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { parseSimplefxCsv } from "@/lib/import/simplefx-csv";

const MAX_ROWS = 2000;

export interface ImportResult {
  imported: number;
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
    return { imported: 0, duplicates: 0, pending: parsed.pending, errors };
  }

  if (parsed.rows.length > MAX_ROWS) {
    return {
      imported: 0,
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

  // Batch: get existing externalIds
  const externalIds = parsed.rows.map((r) => r.externalId);
  const existing = await prisma.trade.findMany({
    where: { externalId: { in: externalIds } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((t) => t.externalId));

  // Filter rows
  let duplicates = 0;
  const validRows = parsed.rows.filter((row) => {
    // Check duplicate
    if (existingIds.has(row.externalId)) {
      duplicates++;
      return false;
    }

    // Check symbol exists
    if (!validSymbols.has(row.symbol.toUpperCase())) {
      errors.push({ line: 0, reason: `Simbolo no encontrado: ${row.symbol}` });
      return false;
    }

    return true;
  });

  if (validRows.length === 0) {
    return { imported: 0, duplicates, pending: parsed.pending, errors };
  }

  // Calculate total PnL for capital adjustment
  const totalPnl = validRows.reduce((sum, r) => sum + r.pnl, 0);

  // Atomic transaction: create all trades + positions + update capital
  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
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
            },
          },
        },
      });
    }

    // Adjust account capital
    await tx.account.update({
      where: { id: accountId },
      data: { currentCapital: { increment: totalPnl } },
    });
  });

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/calendar");

  return {
    imported: validRows.length,
    duplicates,
    pending: parsed.pending,
    errors,
  };
}
