"use client";

import { usePrices } from "@/contexts/price-context";
import { calcUnrealizedPnl } from "@/lib/calculations";

interface Trade {
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  size: number | null;
  status: string;
}

interface Stats {
  total: number;
  openCount: number;
  wins: number;
  losses: number;
  totalPnl: number;
}

export function TradesSummary({
  stats,
  openTrades,
  statusFilter,
}: {
  stats: Stats;
  openTrades: Trade[];
  statusFilter: "ALL" | "OPEN" | "CLOSED";
}) {
  const { prices } = usePrices();

  const showFloating = statusFilter !== "CLOSED" && openTrades.length > 0;

  let floatingPnl = 0;
  if (showFloating) {
    for (const trade of openTrades) {
      if (!trade.entry || !trade.size) continue;
      const price = prices[trade.pair];
      if (!price) continue;
      const livePrice = trade.direction === "LONG" ? price.bid : price.ask;
      floatingPnl += calcUnrealizedPnl(trade.entry, livePrice, trade.size, trade.direction);
    }
  }

  const floatingSign = floatingPnl >= 0 ? "+" : "";
  const wr = (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : "—";

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-5 px-4 py-3 bg-[#0e1015] border border-[#252833] rounded-lg font-mono text-[11px]">
      <span className="text-[#d4d4d8]">
        {stats.total} {stats.total === 1 ? "trade" : "trades"}
      </span>
      <span className="text-[#252833]">|</span>
      <span className="text-[#4ade80]">{stats.wins}W</span>
      <span className="text-[#f87171]">{stats.losses}L</span>
      {stats.openCount > 0 && (
        <span className="text-[#5eead4]">{stats.openCount} abiertos</span>
      )}
      {(stats.wins + stats.losses) > 0 && (
        <>
          <span className="text-[#252833]">|</span>
          <span className="text-[#5eead4]">WR: {wr}%</span>
        </>
      )}
      {showFloating && floatingPnl !== 0 && (
        <span className={`ml-auto ${floatingPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
          Flotante: {floatingSign}${Math.abs(floatingPnl).toFixed(2)}
        </span>
      )}
    </div>
  );
}
