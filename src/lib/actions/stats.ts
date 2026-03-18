"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";

export async function getAccountStats(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED" },
    include: { positions: true },
    orderBy: { closedAt: "asc" },
  });

  let wins = 0;
  let losses = 0;
  let totalPnl = 0;
  let bestTrade = 0;
  let worstTrade = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let worstStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const trade of trades) {
    const tradePnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
    totalPnl += tradePnl;

    if (tradePnl > 0) {
      wins++;
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > bestStreak) bestStreak = tempWinStreak;
    } else if (tradePnl < 0) {
      losses++;
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > worstStreak) worstStreak = tempLossStreak;
    } else {
      tempWinStreak = 0;
      tempLossStreak = 0;
    }

    if (tradePnl > bestTrade) bestTrade = tradePnl;
    if (tradePnl < worstTrade) worstTrade = tradePnl;
  }

  // Current streak
  for (let i = trades.length - 1; i >= 0; i--) {
    const pnl = trades[i].positions.reduce((sum, p) => sum + p.pnl, 0);
    if (i === trades.length - 1) {
      currentStreak = pnl >= 0 ? 1 : -1;
    } else {
      if (pnl >= 0 && currentStreak > 0) currentStreak++;
      else if (pnl < 0 && currentStreak < 0) currentStreak--;
      else break;
    }
  }

  const total = wins + losses;

  return {
    totalTrades: total,
    wins,
    losses,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    totalPnl,
    totalPnlPct: account.initialCapital > 0 ? (totalPnl / account.initialCapital) * 100 : 0,
    bestTrade,
    worstTrade,
    currentStreak,
    bestStreak,
    worstStreak,
    currentCapital: account.currentCapital,
    initialCapital: account.initialCapital,
    targetCapital: account.targetCapital,
  };
}

export async function getEquityData(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  // Get closed trades (not positions) with their total P&L
  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED", closedAt: { not: null } },
    include: { positions: true },
    orderBy: { closedAt: "asc" },
  });

  // Aggregate P&L by day
  const dailyPnl: Record<string, { pnl: number; trades: number }> = {};
  for (const trade of trades) {
    const day = trade.closedAt!.toISOString().split("T")[0];
    if (!dailyPnl[day]) dailyPnl[day] = { pnl: 0, trades: 0 };
    dailyPnl[day].pnl += trade.positions.reduce((sum, p) => sum + p.pnl, 0);
    dailyPnl[day].trades++;
  }

  // Sort days and build running capital
  const sortedDays = Object.keys(dailyPnl).sort();

  let runningCapital = account.initialCapital;
  const dataPoints: { date: string; capital: number; pnl: number; trades: number }[] = [
    { date: sortedDays[0] ?? account.createdAt.toISOString().split("T")[0], capital: runningCapital, pnl: 0, trades: 0 },
  ];

  for (const day of sortedDays) {
    runningCapital += dailyPnl[day].pnl;
    dataPoints.push({
      date: day,
      capital: Math.round(runningCapital * 100) / 100,
      pnl: Math.round(dailyPnl[day].pnl * 100) / 100,
      trades: dailyPnl[day].trades,
    });
  }

  return dataPoints;
}

export async function getCalendarData(accountId: string, year: number, month: number) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const trades = await prisma.trade.findMany({
    where: {
      accountId,
      openedAt: { gte: startDate, lte: endDate },
    },
    include: { positions: true },
    orderBy: { openedAt: "asc" },
  });

  const dayMap: Record<string, { trades: number; pnl: number }> = {};

  for (const trade of trades) {
    const dayKey = trade.openedAt.toISOString().split("T")[0];
    if (!dayMap[dayKey]) dayMap[dayKey] = { trades: 0, pnl: 0 };
    dayMap[dayKey].trades++;
    dayMap[dayKey].pnl += trade.positions.reduce((sum, p) => sum + p.pnl, 0);
  }

  return dayMap;
}

export async function getDailyStats(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED", closedAt: { not: null } },
    include: { positions: true },
    orderBy: { closedAt: "asc" },
  });

  const daily: Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    best: number;
    worst: number;
  }> = {};

  for (const trade of trades) {
    const key = trade.closedAt!.toISOString().split("T")[0];
    if (!daily[key]) daily[key] = { trades: 0, wins: 0, losses: 0, pnl: 0, best: 0, worst: 0 };

    const tradePnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
    daily[key].trades++;
    daily[key].pnl += tradePnl;
    if (tradePnl > 0) daily[key].wins++;
    else if (tradePnl < 0) daily[key].losses++;
    if (tradePnl > daily[key].best) daily[key].best = tradePnl;
    if (tradePnl < daily[key].worst) daily[key].worst = tradePnl;
  }

  return daily;
}

export async function getWeeklyMonthlyStats(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED" },
    include: { positions: true },
    orderBy: { closedAt: "asc" },
  });

  const monthly: Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    best: number;
    worst: number;
  }> = {};

  for (const trade of trades) {
    if (!trade.closedAt) continue;
    const key = `${trade.closedAt.getFullYear()}-${String(trade.closedAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) monthly[key] = { trades: 0, wins: 0, losses: 0, pnl: 0, best: 0, worst: 0 };

    const tradePnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
    monthly[key].trades++;
    monthly[key].pnl += tradePnl;
    if (tradePnl > 0) monthly[key].wins++;
    else if (tradePnl < 0) monthly[key].losses++;
    if (tradePnl > monthly[key].best) monthly[key].best = tradePnl;
    if (tradePnl < monthly[key].worst) monthly[key].worst = tradePnl;
  }

  return monthly;
}

export async function getWeeklyStats(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED" },
    include: { positions: true },
    orderBy: { closedAt: "asc" },
  });

  const weekly: Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    best: number;
    worst: number;
  }> = {};

  for (const trade of trades) {
    if (!trade.closedAt) continue;
    // Get Monday of the week
    const d = new Date(trade.closedAt);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const key = monday.toISOString().split("T")[0];

    if (!weekly[key]) weekly[key] = { trades: 0, wins: 0, losses: 0, pnl: 0, best: 0, worst: 0 };

    const tradePnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
    weekly[key].trades++;
    weekly[key].pnl += tradePnl;
    if (tradePnl > 0) weekly[key].wins++;
    else if (tradePnl < 0) weekly[key].losses++;
    if (tradePnl > weekly[key].best) weekly[key].best = tradePnl;
    if (tradePnl < weekly[key].worst) weekly[key].worst = tradePnl;
  }

  return weekly;
}
