"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { Direction } from "@/generated/prisma/client";
import { createTradeSchema, updateTradeSchema, closePositionSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function createTrade(raw: {
  accountId: string;
  pair: string;
  direction: Direction;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  size?: number;
  riskUsd: number;
  riskPct: number;
  externalId?: string;
  notes?: string;
  imageUrl?: string;
  openedAt?: string;
}) {
  const data = createTradeSchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "createTrade", 30, 60_000);
  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const trade = await prisma.trade.create({
    data: {
      accountId: data.accountId,
      pair: data.pair.toUpperCase(),
      direction: data.direction,
      entry: data.entry || null,
      stopLoss: data.stopLoss || null,
      takeProfit: data.takeProfit || null,
      size: data.size || null,
      riskUsd: data.riskUsd,
      riskPct: data.riskPct,
      externalId: data.externalId || null,
      notes: data.notes || null,
      imageUrl: data.imageUrl || null,
      ...(data.openedAt && { openedAt: new Date(data.openedAt) }),
      positions: {
        create: {
          label: "Posicion 1",
        },
      },
    },
    include: { positions: true },
  });

  revalidatePath("/");
  revalidatePath("/trades");
  return trade;
}

export async function getTrades(accountId: string, filters?: {
  status?: "OPEN" | "CLOSED";
  pair?: string;
  direction?: Direction;
  from?: Date;
  to?: Date;
}) {
  const user = await getUser();
  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  return prisma.trade.findMany({
    where: {
      accountId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.pair && { pair: { contains: filters.pair, mode: "insensitive" as const } }),
      ...(filters?.direction && { direction: filters.direction }),
      ...(filters?.from && { openedAt: { gte: filters.from } }),
      ...(filters?.to && { openedAt: { lte: filters.to } }),
    },
    include: { positions: true, images: { orderBy: { createdAt: "asc" } }, checklist: { include: { strategy: true } } },
    orderBy: { openedAt: "desc" },
  });
}

export async function getTradesForExport(accountId: string, filters?: {
  status?: "OPEN" | "CLOSED";
  from?: string;
  to?: string;
}) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const where = {
    accountId,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.from && { openedAt: { gte: new Date(filters.from) } }),
    ...(filters?.to && {
      openedAt: {
        ...(filters?.from && { gte: new Date(filters.from) }),
        lte: new Date(filters.to + "T23:59:59"),
      },
    }),
  };

  return prisma.trade.findMany({
    where,
    include: { positions: true },
    orderBy: { openedAt: "desc" },
  });
}

const PAGE_SIZE = 10;

export async function getTradesPaginated(accountId: string, filters?: {
  status?: "OPEN" | "CLOSED";
  result?: "TP" | "SL" | "BE";
  pair?: string;
  from?: string;
  to?: string;
  cursor?: string;
}) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const where = {
    accountId,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.result && {
      positions: { some: { status: filters.result } },
    }),
    ...(filters?.pair && { pair: filters.pair }),
    ...(filters?.from && { openedAt: { gte: new Date(filters.from) } }),
    ...(filters?.to && {
      openedAt: {
        ...(filters?.from && { gte: new Date(filters.from) }),
        lte: new Date(filters.to + "T23:59:59"),
      },
    }),
  };

  const [trades, total, statsAgg] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: { positions: true, images: { orderBy: { createdAt: "asc" } }, checklist: { include: { strategy: true } } },
      orderBy: [{ status: "asc" }, { openedAt: "desc" }],
      take: PAGE_SIZE + 1,
      ...(filters?.cursor && {
        cursor: { id: filters.cursor },
        skip: 1,
      }),
    }),
    prisma.trade.count({ where }),
    prisma.$queryRaw<
      { open_count: bigint; wins: bigint; losses: bigint; total_pnl: number }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE t.status = 'OPEN')::bigint AS open_count,
        COUNT(*) FILTER (WHERE t.status = 'CLOSED' AND sub_pnl > 0)::bigint AS wins,
        COUNT(*) FILTER (WHERE t.status = 'CLOSED' AND sub_pnl < 0)::bigint AS losses,
        COALESCE(SUM(CASE WHEN t.status = 'CLOSED' THEN sub_pnl ELSE 0 END), 0)::float AS total_pnl
      FROM trades t
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(p.pnl), 0) AS sub_pnl
        FROM positions p WHERE p.trade_id = t.id
      ) pnl ON true
      WHERE t.account_id = ${accountId}
    `,
  ]);

  const hasMore = trades.length > PAGE_SIZE;
  if (hasMore) trades.pop();

  const agg = statsAgg[0];

  return {
    trades,
    total,
    hasMore,
    stats: {
      total,
      openCount: Number(agg?.open_count ?? 0),
      wins: Number(agg?.wins ?? 0),
      losses: Number(agg?.losses ?? 0),
      totalPnl: agg?.total_pnl ?? 0,
    },
  };
}

export async function getTrade(id: string) {
  const user = await getUser();
  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { positions: true, account: true, images: { orderBy: { createdAt: "asc" } }, checklist: { include: { strategy: true } } },
  });
  if (!trade) throw new Error("Trade no encontrado");

  // Verify ownership
  const account = await prisma.account.findFirst({
    where: { id: trade.accountId, userId: user.id },
  });
  if (!account) throw new Error("No autorizado");

  return trade;
}

export async function updateTrade(id: string, raw: {
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  notes?: string | null;
  imageUrl?: string | null;
  externalId?: string | null;
  openedAt?: string;
}) {
  const data = updateTradeSchema.parse(raw);
  await getTrade(id); // verifies ownership

  const { openedAt, ...rest } = data;
  const trade = await prisma.trade.update({
    where: { id },
    data: {
      ...rest,
      ...(openedAt !== undefined && { openedAt: new Date(openedAt) }),
    },
  });
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath(`/trades/${id}`);
  return trade;
}

export async function deleteTrade(id: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteTrade", 10, 60_000);
  await getTrade(id);

  await prisma.trade.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/trades");
}

export async function closePosition(
  positionId: string,
  result: "TP" | "SL" | "BE" | "PARTIAL",
  pnl: number,
  partialPct?: number,
  closedAtStr?: string,
  closePrice?: number
) {
  closePositionSchema.parse({ positionId, result, pnl, partialPct, closedAt: closedAtStr, closePrice });
  const user = await getUser();
  checkRateLimit(user.id, "closePosition", 20, 60_000);

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { trade: { include: { positions: true, account: true } } },
  });
  if (!position) throw new Error("Posicion no encontrada");

  // Verify ownership
  await getTrade(position.tradeId);

  const isPartial = result === "PARTIAL";
  const closedAt = closedAtStr ? new Date(closedAtStr) : new Date();

  // Calculate position size
  const tradeSize = position.trade.size;
  const positionSize = isPartial && partialPct && tradeSize != null
    ? tradeSize * (partialPct / 100)
    : tradeSize;

  // Update position
  await prisma.position.update({
    where: { id: positionId },
    data: {
      status: result,
      size: positionSize ?? null,
      pnl,
      closePrice: closePrice ?? null,
      closedAt,
      isPartial,
      partialPct: partialPct || null,
    },
  });

  // If PARTIAL, reduce trade size proportionally
  if (isPartial && partialPct && position.trade.size != null) {
    const remaining = position.trade.size * (1 - partialPct / 100);
    await prisma.trade.update({
      where: { id: position.tradeId },
      data: { size: Math.round(remaining * 1e8) / 1e8 },
    });
  }

  // If SL, close ALL open positions of this trade
  if (result === "SL") {
    await prisma.position.updateMany({
      where: {
        tradeId: position.tradeId,
        status: "OPEN",
      },
      data: {
        status: "SL",
        pnl: 0,
        closedAt,
      },
    });
  }

  // Update account capital with this position's PnL
  await prisma.account.update({
    where: { id: position.trade.accountId },
    data: {
      currentCapital: { increment: pnl },
    },
  });

  // Check if all positions are closed -> close trade
  const openPositions = await prisma.position.count({
    where: {
      tradeId: position.tradeId,
      status: "OPEN",
    },
  });

  if (openPositions === 0) {
    await prisma.trade.update({
      where: { id: position.tradeId },
      data: {
        status: "CLOSED",
        closedAt,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath(`/trades/${position.tradeId}`);
}
