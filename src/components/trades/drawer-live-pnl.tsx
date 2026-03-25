"use client";

import { usePrices } from "@/contexts/price-context";
import { formatPnl, calcUnrealizedPnl } from "@/lib/calculations";

export function DrawerLivePnl({
  pair,
  direction,
  entry,
  size,
}: {
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  size: number | null;
}) {
  const { prices, decimalsMap, contractSizeMap } = usePrices();
  const isLong = direction === "LONG";
  const priceData = prices[pair];
  const livePrice = priceData ? (isLong ? priceData.bid : priceData.ask) : null;
  const unrealizedPnl =
    entry != null && size != null && livePrice != null
      ? calcUnrealizedPnl(entry, livePrice, size, direction, contractSizeMap[pair] ?? 1)
      : null;
  const dec = decimalsMap[pair] ?? 2;

  if (unrealizedPnl == null) return null;

  return (
    <div className="text-center py-3 space-y-2">
      <div>
        <div className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] mb-1 font-mono">P&L Unrealized</div>
        <div
          className="font-mono text-3xl font-bold s"
          style={{ color: unrealizedPnl >= 0 ? "#4ade80" : "#f87171" }}
        >
          {formatPnl(unrealizedPnl)}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] font-mono">Bid</div>
          <div className="font-mono text-sm text-[#5eead4] s">
            {priceData ? priceData.bid.toFixed(dec) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] font-mono">Ask</div>
          <div className="font-mono text-sm text-[#5eead4] s">
            {priceData ? priceData.ask.toFixed(dec) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
