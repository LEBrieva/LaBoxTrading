"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { Direction } from "@/generated/prisma/client";

export async function createTrade(data: {
  accountId: string;
  pair: string;
  direction: Direction;
  entry?: number;
  stopLoss?: number;
  size?: number;
  riskUsd: number;
  riskPct: number;
  externalId?: string;
  notes?: string;
  imageUrl?: string;
  openedAt?: string;
}) {
  const user = await getUser();
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
    include: { positions: true, images: { orderBy: { createdAt: "asc" } } },
    orderBy: { openedAt: "desc" },
  });
}

export async function getTrade(id: string) {
  const user = await getUser();
  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { positions: true, account: true, images: { orderBy: { createdAt: "asc" } } },
  });
  if (!trade) throw new Error("Trade no encontrado");

  // Verify ownership
  const account = await prisma.account.findFirst({
    where: { id: trade.accountId, userId: user.id },
  });
  if (!account) throw new Error("No autorizado");

  return trade;
}

export async function updateTrade(id: string, data: {
  entry?: number | null;
  stopLoss?: number | null;
  notes?: string | null;
  imageUrl?: string | null;
  externalId?: string | null;
  openedAt?: string;
}) {
  // Verify ownership through getTrade
  await getTrade(id);

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

export async function closePosition(
  positionId: string,
  result: "TP" | "SL" | "BE" | "PARTIAL",
  pnl: number,
  partialPct?: number
) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { trade: { include: { positions: true, account: true } } },
  });
  if (!position) throw new Error("Posicion no encontrada");

  // Verify ownership
  await getTrade(position.tradeId);

  const isPartial = result === "PARTIAL";

  // Update position
  await prisma.position.update({
    where: { id: positionId },
    data: {
      status: result,
      pnl,
      closedAt: new Date(),
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
        closedAt: new Date(),
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
    const allPositions = await prisma.position.findMany({
      where: { tradeId: position.tradeId },
    });
    await prisma.trade.update({
      where: { id: position.tradeId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath(`/trades/${position.tradeId}`);
}
