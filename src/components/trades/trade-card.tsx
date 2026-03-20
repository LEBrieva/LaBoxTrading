"use client";

import { useState } from "react";
import { TradeDrawer } from "./trade-drawer";
import { LiveTradeSection } from "./live-trade-section";

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

interface TradeCardProps extends Trade {
  strategies?: { id: string; name: string; fields: unknown }[];
  onTradeUpdated?: (tradeId: string, updates: Partial<Trade>) => void;
  onTradeDeleted?: (tradeId: string) => void;
  onTradeRestored?: (trade: Trade) => void;
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
}

function statusColor(status: string): string {
  switch (status) {
    case "OPEN": return "text-[#5eead4]";
    case "TP": return "text-[#4ade80]";
    case "SL": return "text-[#f87171]";
    case "BE": return "text-[#fbbf24]";
    default: return "text-[#71717a]";
  }
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

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

export function TradeCard({
  id,
  pair,
  direction,
  riskUsd,
  riskPct,
  entry,
  stopLoss,
  takeProfit,
  size,
  externalId,
  notes,
  imageUrl,
  openedAt,
  closedAt,
  status,
  positions,
  _count,
  checklist,
  strategies,
  onTradeUpdated,
  onTradeDeleted,
  onTradeRestored,
  onPositionClosed,
}: TradeCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLong = direction === "LONG";
  const dirColor = isLong ? "#4ade80" : "#f87171";
  const dec = 2;

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className={`rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 ${
          status === "OPEN"
            ? "border border-[#5eead4]/15 hover:border-[#5eead4]/30"
            : "border border-[#252833] hover:border-[#2f3340]"
        }`}
        style={{
          backgroundColor: isLong ? "rgba(96,165,250,0.03)" : "rgba(251,191,36,0.03)",
          borderLeftWidth: "0",
        }}
      >
        <div className="flex">
          {/* Side label */}
          <div
            className="relative flex items-center justify-center shrink-0"
            style={{
              width: "22px",
              backgroundColor: status === "OPEN" ? "rgba(94,234,212,0.08)" : `${dirColor}08`,
              borderRight: status === "OPEN" ? "1px solid rgba(94,234,212,0.25)" : `1px solid ${dirColor}20`,
            }}
          >
            <span
              className="absolute text-[10px] font-black uppercase tracking-[6px] whitespace-nowrap"
              style={{
                color: status === "OPEN" ? "#5eead4" : "#52525b",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              {status === "OPEN" ? "Abierto" : "Cerrado"}
            </span>
          </div>

          {/* Card content */}
          <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center px-4 md:px-5 pt-4 pb-2">
          {/* Direction badge — left */}
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] rounded border shrink-0"
            style={{
              color: dirColor,
              backgroundColor: isLong
                ? "rgba(74,222,128,0.1)"
                : "rgba(248,113,113,0.1)",
              borderColor: isLong
                ? "rgba(74,222,128,0.25)"
                : "rgba(248,113,113,0.25)",
            }}
          >
            {isLong ? "Long" : "Short"}
          </span>

          {/* Pair + ID — center */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="text-[#d4d4d8] font-black text-base tracking-wide">
              {pair}
            </span>
            {externalId && (
              <span className="text-[#52525b] text-[10px] font-mono">
                #{externalId.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Badges — right */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Status / Result badge (only for closed trades) */}
            {(() => {
              if (status === "OPEN") return null;
              const resultMap: Record<string, { label: string; color: string }> = {
                TP: { label: "TP", color: "#4ade80" },
                SL: { label: "SL", color: "#f87171" },
                BE: { label: "BE", color: "#fbbf24" },
                PARTIAL: { label: "Parcial", color: "#5eead4" },
              };
              const posStatuses = positions.map((p) => p.status);
              const mainResult = posStatuses.find((s) => s !== "OPEN") || "TP";
              const cfg = resultMap[mainResult] || { label: "Cerrado", color: "#71717a" };
              return (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] rounded border"
                  style={{ color: cfg.color, backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40` }}
                >
                  {cfg.label}
                </span>
              );
            })()}
            {_count.images > 0 && (
              <span
                title={`${_count.images} screenshot${_count.images > 1 ? "s" : ""}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[#71717a] font-mono rounded border border-[#252833]"
              >
                ▣ {_count.images}
              </span>
            )}
            {checklist?.strategy && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-[#a78bfa] font-mono rounded border border-[#a78bfa]/25 bg-[#a78bfa]/10"
              >
                ◇ {checklist.strategy.name}
              </span>
            )}
            <span className="text-[#52525b] text-[10px] font-mono">
              {timeAgo(openedAt)}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-4 md:px-5 py-3">
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Entrada
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold s">
              {entry?.toFixed(dec) ?? "—"}
            </span>
          </div>
          {status === "OPEN" ? (
            <>
              <div>
                {(() => {
                  const isBE =
                    entry != null &&
                    stopLoss != null &&
                    ((isLong && stopLoss >= entry) || (!isLong && stopLoss <= entry));
                  return (
                    <>
                      <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
                        {isBE ? "BE" : "SL"}
                      </span>
                      <span
                        className="font-mono text-sm font-semibold s"
                        style={{ color: isBE ? "#fbbf24" : "#f87171" }}
                      >
                        {stopLoss?.toFixed(dec) ?? "—"}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
                  TP
                </span>
                <span className="font-mono text-sm font-semibold text-[#4ade80] s">
                  {takeProfit?.toFixed(dec) ?? "—"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
                  Cierre
                </span>
                <span className="font-mono text-sm text-[#d4d4d8] font-semibold s">
                  {(() => {
                    const closedPos = positions.filter((p) => p.closePrice != null);
                    if (closedPos.length === 0) return "—";
                    const lastClosed = closedPos[closedPos.length - 1];
                    return lastClosed.closePrice!.toFixed(dec);
                  })()}
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
                  P&L
                </span>
                <span
                  className="font-mono text-sm font-black s"
                  style={{ color: pnlColor(positions.reduce((s, p) => s + p.pnl, 0)) }}
                >
                  {formatPnlValue(positions.reduce((s, p) => s + p.pnl, 0))}
                </span>
              </div>
            </>
          )}
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Tamaño
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold s">
              {size ?? "—"}
            </span>
          </div>
        </div>

        {/* Live P&L or static result */}
        {(() => {
          const openPos = positions.find((p) => p.status === "OPEN");
          const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
          if (openPos) {
            return (
              <LiveTradeSection
                trade={{ id, pair, direction, riskUsd, riskPct, entry, stopLoss, takeProfit, size, externalId, notes, imageUrl, openedAt, closedAt, status, positions, _count, checklist }}
                positionId={openPos.id}
                onPositionClosed={onPositionClosed}
              />
            );
          }
          return (
            <div className="flex items-center justify-between px-4 md:px-5 pb-4 pt-2 border-t border-[#252833]">
              <span className="text-[9px] uppercase tracking-[2px] text-[#52525b] font-medium">
                Resultado
              </span>
              <span
                className="font-mono text-sm font-black s"
                style={{ color: pnlColor(totalPnl) }}
              >
                {formatPnlValue(totalPnl)}
              </span>
            </div>
          );
        })()}
          </div>
        </div>
      </div>

      <TradeDrawer
        trade={{
          id,
          pair,
          direction,
          entry,
          stopLoss,
          takeProfit,
          size,
          riskUsd,
          riskPct,
          externalId,
          notes,
          imageUrl,
          openedAt,
          closedAt,
          status,
          positions,
          _count,
          checklist,
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        strategies={strategies}
        onTradeUpdated={onTradeUpdated}
        onTradeDeleted={onTradeDeleted}
        onTradeRestored={onTradeRestored}
        onPositionClosed={onPositionClosed}
      />
    </>
  );
}
