"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { getAccountStats } from "@/lib/actions/stats";

export interface AccountStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalPnlPct: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  currentCapital: number;
  initialCapital: number;
  targetCapital: number;
}

interface StatsContextValue {
  stats: AccountStats;
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const defaultStats: AccountStats = {
  totalTrades: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  totalPnl: 0,
  totalPnlPct: 0,
  bestTrade: 0,
  worstTrade: 0,
  currentStreak: 0,
  bestStreak: 0,
  worstStreak: 0,
  currentCapital: 0,
  initialCapital: 0,
  targetCapital: 0,
};

const StatsContext = createContext<StatsContextValue>({
  stats: defaultStats,
  loading: true,
  refreshStats: async () => {},
});

export function useStats() {
  return useContext(StatsContext);
}

export function StatsProvider({
  accountId,
  fallback,
  children,
}: {
  accountId: string;
  fallback: { currentCapital: number; initialCapital: number; targetCapital: number };
  children: ReactNode;
}) {
  const [stats, setStats] = useState<AccountStats>({
    ...defaultStats,
    ...fallback,
  });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const refreshStats = useCallback(async () => {
    if (!accountId) return;
    try {
      const data = await getAccountStats(accountId);
      setStats(data);
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Fetch on mount — guard against StrictMode double-mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refreshStats();
  }, [refreshStats]);

  // Re-fetch when server-side fallback changes (e.g. after deposit/withdrawal)
  const prevFallbackRef = useRef(fallback);
  useEffect(() => {
    const prev = prevFallbackRef.current;
    if (
      prev.currentCapital !== fallback.currentCapital ||
      prev.initialCapital !== fallback.initialCapital ||
      prev.targetCapital !== fallback.targetCapital
    ) {
      prevFallbackRef.current = fallback;
      refreshStats();
    }
  }, [fallback, refreshStats]);

  return (
    <StatsContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
}
