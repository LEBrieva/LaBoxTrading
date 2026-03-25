"use client";

import { usePrices } from "@/contexts/price-context";
import { calcUnrealizedPnl } from "@/lib/calculations";

interface Trade {
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  size: number | null;
}

export function FloatingPnl({ openTrades }: { openTrades: Trade[] }) {
  const { prices, contractSizeMap } = usePrices();

  let floatingPnl = 0;
  for (const trade of openTrades) {
    if (!trade.entry || !trade.size) continue;
    const price = prices[trade.pair];
    if (!price) continue;
    const livePrice = trade.direction === "LONG" ? price.bid : price.ask;
    floatingPnl += calcUnrealizedPnl(trade.entry, livePrice, trade.size, trade.direction, contractSizeMap[trade.pair] ?? 1);
  }

  if (floatingPnl === 0) return null;

  const sign = floatingPnl >= 0 ? "+" : "";

  return (
    <span className={`ml-auto ${floatingPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
      Flotante: <span className="s">{sign}${Math.abs(floatingPnl).toFixed(2)}</span>
    </span>
  );
}
