"use client";

import { useStats } from "@/contexts/stats-context";
import { formatPnl, formatCurrency, formatPct, calcProgressPct } from "@/lib/calculations";

export function DashboardStatsBar() {
  const { stats, loading } = useStats();

  const progress = calcProgressPct(stats.currentCapital, stats.initialCapital, stats.targetCapital);
  const pnlIsPositive = stats.totalPnl >= 0;
  const pnlPrefix = pnlIsPositive ? "+$" : "-$";
  const pnlValue = Math.abs(stats.totalPnl).toFixed(2);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#252833] bg-[#0e1015]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 ${i < 4 ? "md:border-r" : ""} border-[#252833] ${i < 4 ? "" : "col-span-2 md:col-span-1"}`}
          >
            <div className="h-3 w-16 bg-[#252833] rounded mb-2 animate-pulse" />
            <div className="h-6 w-24 bg-[#252833] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#252833] bg-[#0e1015]">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
        <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">P&L Total</p>
        <p className="font-mono text-base md:text-xl font-bold s" style={{ color: pnlIsPositive ? "#4ade80" : "#f87171" }}>
          {pnlPrefix}{pnlValue}
        </p>
        <p className="font-mono text-[10px] text-[#71717a] mt-0.5 s">{formatPct(stats.totalPnlPct)}</p>
      </div>

      <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
        <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Win Rate</p>
        <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#5eead4" }}>{stats.winRate.toFixed(1)}%</p>
        <p className="font-mono text-[10px] text-[#71717a] mt-0.5">{stats.wins}W / {stats.losses}L de {stats.totalTrades}</p>
      </div>

      <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
        <p className="text-[9px] uppercase tracking-[1.5px] md:tracking-[2px] text-[#52525b] mb-1.5 font-medium">Cerrados</p>
        <p className="font-mono text-base md:text-xl font-bold text-[#d4d4d8]">{stats.totalTrades}</p>
        <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
          racha {stats.currentStreak > 0 ? "+" : ""}{stats.currentStreak}
        </p>
      </div>

      <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
        <p className="text-[9px] uppercase tracking-[1.5px] md:tracking-[2px] text-[#52525b] mb-1.5 font-medium">Mejor Trade</p>
        <p className="font-mono text-base md:text-xl font-bold s" style={{ color: "#4ade80" }}>+${stats.bestTrade.toFixed(2)}</p>
        <p className="font-mono text-[10px] text-[#71717a] mt-0.5 s">peor {formatPnl(stats.worstTrade)}</p>
      </div>

      <div className="col-span-2 md:col-span-1 px-4 py-3 md:px-6 md:py-4">
        <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Objetivo</p>
        <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#fbbf24" }}>{progress.toFixed(1)}%</p>
        <p className="font-mono text-[10px] text-[#71717a] mt-0.5 s">{formatCurrency(stats.targetCapital)}</p>
      </div>
    </div>
  );
}
