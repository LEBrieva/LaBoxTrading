"use client";

import { useEffect } from "react";
import { usePrices } from "@/contexts/price-context";
import { calcUnrealizedPnl } from "@/lib/calculations";
import { ClosePositionDialog } from "./close-position-dialog";

interface Position {
  id: string;
  label: string;
  status: string;
  size: number | null;
  pnl: number;
  closePrice: number | null;
  isPartial: boolean;
  partialPct: number | null;
  closedAt: Date | null;
}

interface Trade {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  riskUsd: number;
  riskPct: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  size: number | null;
  externalId: string | null;
  notes: string | null;
  imageUrl: string | null;
  openedAt: Date;
  closedAt: Date | null;
  status: string;
  positions: Position[];
  _count: { images: number };
  checklist?: {
    id: string;
    strategyId: string | null;
    strategy: { id: string; name: string } | null;
  } | null;
}

function pnlColor(pnl: number): string {
  if (pnl > 0) return "#4ade80";
  if (pnl < 0) return "#f87171";
  return "#71717a";
}

function formatPnlValue(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function LiveTradeSection({
  trade,
  positionId,
  onPositionClosed,
}: {
  trade: Trade;
  positionId: string;
  onPositionClosed?: (
    tradeId: string,
    positionId: string,
    closedPosition: {
      status: string;
      pnl: number;
      closePrice?: number;
      closedAt?: string;
      partialPct?: number;
    },
    tradeUpdates?: Partial<Trade>
  ) => void;
}) {
  const { prices, decimalsMap, subscribePair } = usePrices();
  const isLong = trade.direction === "LONG";
  const priceData = prices[trade.pair];
  const livePrice = priceData ? (isLong ? priceData.bid : priceData.ask) : null;
  const unrealizedPnl =
    trade.entry != null && trade.size != null && livePrice != null
      ? calcUnrealizedPnl(trade.entry, livePrice, trade.size, trade.direction)
      : null;
  const dec = decimalsMap[trade.pair] ?? 2;

  useEffect(() => {
    subscribePair(trade.pair);
  }, [trade.pair, subscribePair]);

  return (
    <div className="px-4 md:px-5 pb-4 pt-2 border-t border-[#252833] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] font-medium">
              Precio
            </span>
            <span className="font-mono text-sm text-[#5eead4] font-semibold s">
              {livePrice != null ? livePrice.toFixed(dec) : "—"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] font-medium">
            P&L
          </span>
          <span
            className="font-mono text-sm font-black s"
            style={{ color: unrealizedPnl != null ? pnlColor(unrealizedPnl) : "#71717a" }}
          >
            {unrealizedPnl != null ? formatPnlValue(unrealizedPnl) : "—"}
          </span>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <ClosePositionDialog
          positionId={positionId}
          positionLabel={trade.pair}
          riskUsd={trade.riskUsd}
          livePrice={livePrice}
          onPositionClosed={onPositionClosed}
          trade={trade}
        />
      </div>
    </div>
  );
}
