"use client";

import { usePrices } from "@/contexts/price-context";
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

export function LiveCloseButton({
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
  const { prices } = usePrices();
  const isLong = trade.direction === "LONG";
  const priceData = prices[trade.pair];
  const livePrice = priceData ? (isLong ? priceData.bid : priceData.ask) : null;

  return (
    <ClosePositionDialog
      positionId={positionId}
      positionLabel={trade.pair}
      riskUsd={trade.riskUsd}
      livePrice={livePrice}
      onPositionClosed={onPositionClosed}
      trade={trade}
    />
  );
}
