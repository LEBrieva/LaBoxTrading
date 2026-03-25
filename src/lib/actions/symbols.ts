"use server";

import { prisma } from "@/lib/prisma";
import type { Broker } from "@/generated/prisma/client";
import { getUser } from "./auth";
import { cookies } from "next/headers";

export async function getSymbols(broker?: Broker) {
  return prisma.symbol.findMany({
    where: broker ? { broker } : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getSymbolDecimalsMap(broker?: Broker): Promise<Record<string, number>> {
  const symbols = await prisma.symbol.findMany({
    where: broker ? { broker } : undefined,
    select: { name: true, decimals: true },
  });
  return Object.fromEntries(symbols.map((s) => [s.name, s.decimals]));
}

export async function getContractSizeMap(broker?: Broker): Promise<Record<string, number>> {
  const symbols = await prisma.symbol.findMany({
    where: broker ? { broker } : undefined,
    select: { name: true, contractSize: true },
  });
  return Object.fromEntries(symbols.map((s) => [s.name, s.contractSize]));
}

export async function syncContractSizes() {
  const res = await fetch("https://simplefx.com/utils/instruments.json");
  if (!res.ok) throw new Error("Failed to fetch SimpleFX instruments");
  const data = await res.json() as Record<string, { symbol: string; contractSize: number }>;

  // Build map: symbol → contractSize from SimpleFX
  const sfxMap = new Map<string, number>();
  for (const val of Object.values(data)) {
    if (val.symbol && val.contractSize != null) {
      sfxMap.set(val.symbol.toUpperCase(), val.contractSize);
    }
  }

  // Get all SIMPLEFX symbols from our DB
  const symbols = await prisma.symbol.findMany({
    where: { broker: "SIMPLEFX" },
    select: { id: true, name: true, contractSize: true },
  });

  let updated = 0;
  for (const sym of symbols) {
    const cs = sfxMap.get(sym.name.toUpperCase());
    if (cs != null && cs !== sym.contractSize) {
      await prisma.symbol.update({
        where: { id: sym.id },
        data: { contractSize: cs },
      });
      updated++;
    }
  }

  return { total: symbols.length, updated, source: sfxMap.size };
}

export async function getUsedPairs(accountId: string): Promise<string[]> {
  const trades = await prisma.trade.findMany({
    where: { accountId },
    select: { pair: true },
    distinct: ["pair"],
    orderBy: { pair: "asc" },
  });
  return trades.map((t) => t.pair);
}

export async function getOpenTradePairs() {
  const user = await getUser();
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get("activeAccountId")?.value;

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  const accountId = activeAccountId && accounts.some((a) => a.id === activeAccountId)
    ? activeAccountId
    : accounts[0]?.id;

  if (!accountId) return [];

  const trades = await prisma.trade.findMany({
    where: { accountId, status: "OPEN" },
    select: { pair: true },
    distinct: ["pair"],
  });

  return trades.map((t) => t.pair);
}
