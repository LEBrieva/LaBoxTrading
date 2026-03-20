"use client";

import { useStats } from "@/contexts/stats-context";
import { formatCurrency } from "@/lib/calculations";

export function HeaderStats({ currency }: { currency: string }) {
  const { stats, loading } = useStats();

  return (
    <>
      <div className="text-right">
        <div className="text-[9px] uppercase tracking-[2px] text-[#71717a] font-mono">P&L</div>
        <div
          className={`font-mono text-base md:text-xl font-bold transition-opacity ${
            loading
              ? "text-[#52525b]"
              : stats.totalPnl >= 0
                ? "text-[#4ade80]"
                : "text-[#f87171]"
          }`}
        >
          {loading
            ? "—"
            : <span className="s">{`${stats.totalPnl >= 0 ? "+" : ""}${formatCurrency(stats.totalPnl, currency)}`}</span>}
        </div>
      </div>
      <div className="hidden md:block w-px h-8 bg-[#252833]" />
      <div className="text-right">
        <div className="text-[9px] uppercase tracking-[2px] text-[#71717a] font-mono">Capital</div>
        <div
          className="font-mono text-base md:text-xl font-bold text-[#4ade80]"
          style={{ textShadow: "0 0 20px rgba(74,222,128,0.15)" }}
        >
          <span className="s">{formatCurrency(stats.currentCapital, currency)}</span>
        </div>
        <div className="font-mono text-[10px] text-[#52525b]">
          inicio: <span className="s">{formatCurrency(stats.initialCapital)}</span>
        </div>
      </div>
    </>
  );
}
