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

  const tradeRows = await prisma.$queryRaw<
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

  const txRows = await prisma.$queryRaw<
    { day: string; deposits: number; withdrawals: number }[]
  >`
    SELECT
      TO_CHAR(date, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END), 0)::float AS deposits,
      COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END), 0)::float AS withdrawals
    FROM transactions
    WHERE account_id = ${accountId}
    GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  // Merge trades and transactions by day
  const dayMap = new Map<string, { pnl: number; trades: number; deposit: number; withdrawal: number }>();

  for (const row of tradeRows) {
    dayMap.set(row.day, {
      pnl: row.pnl,
      trades: Number(row.trades),
      deposit: 0,
      withdrawal: 0,
    });
  }

  for (const row of txRows) {
    const existing = dayMap.get(row.day);
    if (existing) {
      existing.deposit = row.deposits;
      existing.withdrawal = row.withdrawals;
    } else {
      dayMap.set(row.day, {
        pnl: 0,
        trades: 0,
        deposit: row.deposits,
        withdrawal: row.withdrawals,
      });
    }
  }

  const sortedDays = [...dayMap.keys()].sort();

  let runningCapital = account.initialCapital;
  const startDate = sortedDays[0] ?? account.createdAt.toISOString().split("T")[0];
  const dataPoints: { date: string; capital: number; pnl: number; trades: number; deposit: number; withdrawal: number }[] = [
    { date: startDate, capital: runningCapital, pnl: 0, trades: 0, deposit: 0, withdrawal: 0 },
  ];

  for (const day of sortedDays) {
    const d = dayMap.get(day)!;
    runningCapital += d.pnl + d.deposit - d.withdrawal;
    dataPoints.push({
      date: day,
      capital: Math.round(runningCapital * 100) / 100,
      pnl: Math.round(d.pnl * 100) / 100,
      trades: d.trades,
      deposit: Math.round(d.deposit * 100) / 100,
      withdrawal: Math.round(d.withdrawal * 100) / 100,
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

export interface BreakdownTrade {
  pair: string;
  strategy: string;
  pnl: number;
  closedAt: string;
}

export async function getBreakdownStats(accountId: string): Promise<BreakdownTrade[]> {
  await verifyAccountOwnership(accountId);

  const rows = await prisma.$queryRaw<
    { pair: string; strategy: string; pnl: number; closed_at: Date }[]
  >`
    SELECT
      t.pair,
      COALESCE(s.name, 'Sin estrategia') AS strategy,
      COALESCE(SUM(p.pnl), 0)::float AS pnl,
      t.closed_at
    FROM trades t
    LEFT JOIN positions p ON p.trade_id = t.id
    LEFT JOIN trade_checklists tc ON tc.trade_id = t.id
    LEFT JOIN strategies s ON s.id = tc.strategy_id
    WHERE t.account_id = ${accountId}
      AND t.status = 'CLOSED'
      AND t.closed_at IS NOT NULL
    GROUP BY t.id, t.pair, s.name, t.closed_at
    ORDER BY t.closed_at ASC
  `;

  return rows.map((r) => ({
    pair: r.pair,
    strategy: r.strategy,
    pnl: Math.round(r.pnl * 100) / 100,
    closedAt: r.closed_at.toISOString().split("T")[0],
  }));
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

// ── Timeline ──────────────────────────────────────────────────────

export interface TimelineEntry {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRADE";
  date: string;
  amount: number;
  balance: number;
  label: string;
  note: string | null;
}

const TIMELINE_PAGE_SIZE = 30;

export async function getTimelineData(accountId: string, cursor?: string) {
  const account = await verifyAccountOwnership(accountId);

  // UNION: transactions + closed trades with PnL
  const rows = await prisma.$queryRaw<
    { id: string; type: string; date: Date; amount: number; label: string; note: string | null }[]
  >`
    (
      SELECT
        tx.id,
        tx.type::text AS type,
        tx.date,
        tx.amount::float AS amount,
        CASE tx.type
          WHEN 'DEPOSIT' THEN 'Depósito'
          WHEN 'WITHDRAWAL' THEN 'Retiro'
        END AS label,
        tx.note
      FROM transactions tx
      WHERE tx.account_id = ${accountId}
    )
    UNION ALL
    (
      SELECT
        t.id,
        'TRADE' AS type,
        t.closed_at AS date,
        COALESCE(SUM(p.pnl), 0)::float AS amount,
        t.pair || ' ' || t.direction AS label,
        NULL AS note
      FROM trades t
      LEFT JOIN positions p ON p.trade_id = t.id
      WHERE t.account_id = ${accountId}
        AND t.status = 'CLOSED'
        AND t.closed_at IS NOT NULL
      GROUP BY t.id, t.closed_at, t.pair, t.direction
    )
    ORDER BY date DESC
  `;

  // Compute running balance from initialCapital
  // First, compute forward (chronological) to get balances, then reverse for display
  const chronological = [...rows].reverse();
  let balance = account.initialCapital;
  const balanceMap = new Map<string, number>();

  for (const row of chronological) {
    if (row.type === "DEPOSIT") {
      balance += row.amount;
    } else if (row.type === "WITHDRAWAL") {
      balance -= row.amount;
    } else {
      balance += row.amount;
    }
    balanceMap.set(row.id, Math.round(balance * 100) / 100);
  }

  // Apply cursor-based pagination
  let startIdx = 0;
  if (cursor) {
    const cursorIdx = rows.findIndex((r) => r.id === cursor);
    if (cursorIdx >= 0) startIdx = cursorIdx + 1;
  }

  const page = rows.slice(startIdx, startIdx + TIMELINE_PAGE_SIZE + 1);
  const hasMore = page.length > TIMELINE_PAGE_SIZE;
  if (hasMore) page.pop();

  const entries: TimelineEntry[] = page.map((row) => ({
    id: row.id,
    type: row.type as "DEPOSIT" | "WITHDRAWAL" | "TRADE",
    date: row.date.toISOString(),
    amount: row.type === "WITHDRAWAL" ? -row.amount : row.amount,
    balance: balanceMap.get(row.id) ?? 0,
    label: row.label,
    note: row.note,
  }));

  return { entries, hasMore };
}
