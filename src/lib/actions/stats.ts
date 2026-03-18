"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";

async function verifyAccountOwnership(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Cuenta no encontrada");
  return account;
}

// Helper: get closed trades with pre-computed PnL (single query with SUM)
async function getTradesWithPnl(accountId: string) {
  const rows = await prisma.$queryRaw<
    { id: string; closed_at: Date; pnl: number }[]
  >`
    SELECT t.id, t.closed_at, COALESCE(SUM(p.pnl), 0)::float AS pnl
    FROM trades t
    LEFT JOIN positions p ON p.trade_id = t.id
    WHERE t.account_id = ${accountId}
      AND t.status = 'CLOSED'
      AND t.closed_at IS NOT NULL
    GROUP BY t.id, t.closed_at
    ORDER BY t.closed_at ASC
  `;
  return rows;
}

export async function getAccountStats(accountId: string) {
  const account = await verifyAccountOwnership(accountId);

  // Aggregate counts in DB
  const [agg] = await prisma.$queryRaw<
    { total: bigint; wins: bigint; losses: bigint; total_pnl: number; best: number; worst: number }[]
  >`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE trade_pnl > 0)::bigint AS wins,
      COUNT(*) FILTER (WHERE trade_pnl < 0)::bigint AS losses,
      COALESCE(SUM(trade_pnl), 0)::float AS total_pnl,
      COALESCE(MAX(trade_pnl), 0)::float AS best,
      COALESCE(MIN(trade_pnl), 0)::float AS worst
    FROM (
      SELECT t.id, COALESCE(SUM(p.pnl), 0) AS trade_pnl
      FROM trades t
      LEFT JOIN positions p ON p.trade_id = t.id
      WHERE t.account_id = ${accountId} AND t.status = 'CLOSED'
      GROUP BY t.id
    ) sub
  `;

  const total = Number(agg?.total ?? 0);
  const wins = Number(agg?.wins ?? 0);
  const losses = Number(agg?.losses ?? 0);
  const totalPnl = agg?.total_pnl ?? 0;
  const bestTrade = agg?.best ?? 0;
  const worstTrade = agg?.worst ?? 0;

  // Streaks need ordered iteration — use lightweight query (no positions loaded)
  const trades = await getTradesWithPnl(accountId);

  let currentStreak = 0;
  let bestStreak = 0;
  let worstStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const trade of trades) {
    if (trade.pnl > 0) {
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > bestStreak) bestStreak = tempWinStreak;
    } else if (trade.pnl < 0) {
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > worstStreak) worstStreak = tempLossStreak;
    } else {
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  }

  for (let i = trades.length - 1; i >= 0; i--) {
    const pnl = trades[i].pnl;
    if (i === trades.length - 1) {
      currentStreak = pnl >= 0 ? 1 : -1;
    } else {
      if (pnl >= 0 && currentStreak > 0) currentStreak++;
      else if (pnl < 0 && currentStreak < 0) currentStreak--;
      else break;
    }
  }

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
  const account = await verifyAccountOwnership(accountId);

  const rows = await prisma.$queryRaw<
    { day: string; pnl: number; trades: bigint }[]
  >`
    SELECT
      TO_CHAR(t.closed_at, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(p.pnl), 0)::float AS pnl,
      COUNT(DISTINCT t.id)::bigint AS trades
    FROM trades t
    LEFT JOIN positions p ON p.trade_id = t.id
    WHERE t.account_id = ${accountId}
      AND t.status = 'CLOSED'
      AND t.closed_at IS NOT NULL
    GROUP BY TO_CHAR(t.closed_at, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  let runningCapital = account.initialCapital;
  const startDate = rows[0]?.day ?? account.createdAt.toISOString().split("T")[0];
  const dataPoints: { date: string; capital: number; pnl: number; trades: number }[] = [
    { date: startDate, capital: runningCapital, pnl: 0, trades: 0 },
  ];

  for (const row of rows) {
    runningCapital += row.pnl;
    dataPoints.push({
      date: row.day,
      capital: Math.round(runningCapital * 100) / 100,
      pnl: Math.round(row.pnl * 100) / 100,
      trades: Number(row.trades),
    });
  }

  return dataPoints;
}

export async function getCalendarData(accountId: string, year: number, month: number) {
  await verifyAccountOwnership(accountId);

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const rows = await prisma.$queryRaw<
    { day: string; trades: bigint; pnl: number }[]
  >`
    SELECT
      TO_CHAR(t.opened_at, 'YYYY-MM-DD') AS day,
      COUNT(DISTINCT t.id)::bigint AS trades,
      COALESCE(SUM(p.pnl), 0)::float AS pnl
    FROM trades t
    LEFT JOIN positions p ON p.trade_id = t.id
    WHERE t.account_id = ${accountId}
      AND t.opened_at >= ${startDate}
      AND t.opened_at <= ${endDate}
    GROUP BY TO_CHAR(t.opened_at, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  const dayMap: Record<string, { trades: number; pnl: number }> = {};
  for (const row of rows) {
    dayMap[row.day] = { trades: Number(row.trades), pnl: row.pnl };
  }
  return dayMap;
}

export async function getDailyStats(accountId: string) {
  await verifyAccountOwnership(accountId);

  const rows = await prisma.$queryRaw<
    { day: string; trades: bigint; wins: bigint; losses: bigint; pnl: number; best: number; worst: number }[]
  >`
    SELECT
      sub.day,
      COUNT(*)::bigint AS trades,
      COUNT(*) FILTER (WHERE sub.trade_pnl > 0)::bigint AS wins,
      COUNT(*) FILTER (WHERE sub.trade_pnl < 0)::bigint AS losses,
      SUM(sub.trade_pnl)::float AS pnl,
      MAX(sub.trade_pnl)::float AS best,
      MIN(sub.trade_pnl)::float AS worst
    FROM (
      SELECT
        TO_CHAR(t.closed_at, 'YYYY-MM-DD') AS day,
        COALESCE(SUM(p.pnl), 0) AS trade_pnl
      FROM trades t
      LEFT JOIN positions p ON p.trade_id = t.id
      WHERE t.account_id = ${accountId} AND t.status = 'CLOSED' AND t.closed_at IS NOT NULL
      GROUP BY t.id, TO_CHAR(t.closed_at, 'YYYY-MM-DD')
    ) sub
    GROUP BY sub.day
    ORDER BY sub.day ASC
  `;

  const daily: Record<string, { trades: number; wins: number; losses: number; pnl: number; best: number; worst: number }> = {};
  for (const row of rows) {
    daily[row.day] = {
      trades: Number(row.trades),
      wins: Number(row.wins),
      losses: Number(row.losses),
      pnl: row.pnl,
      best: row.best,
      worst: row.worst,
    };
  }
  return daily;
}

export async function getWeeklyMonthlyStats(accountId: string) {
  await verifyAccountOwnership(accountId);

  const rows = await prisma.$queryRaw<
    { month: string; trades: bigint; wins: bigint; losses: bigint; pnl: number; best: number; worst: number }[]
  >`
    SELECT
      sub.month,
      COUNT(*)::bigint AS trades,
      COUNT(*) FILTER (WHERE sub.trade_pnl > 0)::bigint AS wins,
      COUNT(*) FILTER (WHERE sub.trade_pnl < 0)::bigint AS losses,
      SUM(sub.trade_pnl)::float AS pnl,
      MAX(sub.trade_pnl)::float AS best,
      MIN(sub.trade_pnl)::float AS worst
    FROM (
      SELECT
        TO_CHAR(t.closed_at, 'YYYY-MM') AS month,
        COALESCE(SUM(p.pnl), 0) AS trade_pnl
      FROM trades t
      LEFT JOIN positions p ON p.trade_id = t.id
      WHERE t.account_id = ${accountId} AND t.status = 'CLOSED' AND t.closed_at IS NOT NULL
      GROUP BY t.id, TO_CHAR(t.closed_at, 'YYYY-MM')
    ) sub
    GROUP BY sub.month
    ORDER BY sub.month ASC
  `;

  const monthly: Record<string, { trades: number; wins: number; losses: number; pnl: number; best: number; worst: number }> = {};
  for (const row of rows) {
    monthly[row.month] = {
      trades: Number(row.trades),
      wins: Number(row.wins),
      losses: Number(row.losses),
      pnl: row.pnl,
      best: row.best,
      worst: row.worst,
    };
  }
  return monthly;
}

export async function getWeeklyStats(accountId: string) {
  await verifyAccountOwnership(accountId);

  const rows = await prisma.$queryRaw<
    { week: string; trades: bigint; wins: bigint; losses: bigint; pnl: number; best: number; worst: number }[]
  >`
    SELECT
      sub.week,
      COUNT(*)::bigint AS trades,
      COUNT(*) FILTER (WHERE sub.trade_pnl > 0)::bigint AS wins,
      COUNT(*) FILTER (WHERE sub.trade_pnl < 0)::bigint AS losses,
      SUM(sub.trade_pnl)::float AS pnl,
      MAX(sub.trade_pnl)::float AS best,
      MIN(sub.trade_pnl)::float AS worst
    FROM (
      SELECT
        TO_CHAR(DATE_TRUNC('week', t.closed_at), 'YYYY-MM-DD') AS week,
        COALESCE(SUM(p.pnl), 0) AS trade_pnl
      FROM trades t
      LEFT JOIN positions p ON p.trade_id = t.id
      WHERE t.account_id = ${accountId} AND t.status = 'CLOSED' AND t.closed_at IS NOT NULL
      GROUP BY t.id, TO_CHAR(DATE_TRUNC('week', t.closed_at), 'YYYY-MM-DD')
    ) sub
    GROUP BY sub.week
    ORDER BY sub.week ASC
  `;

  const weekly: Record<string, { trades: number; wins: number; losses: number; pnl: number; best: number; worst: number }> = {};
  for (const row of rows) {
    weekly[row.week] = {
      trades: Number(row.trades),
      wins: Number(row.wins),
      losses: Number(row.losses),
      pnl: row.pnl,
      best: row.best,
      worst: row.worst,
    };
  }
  return weekly;
}
