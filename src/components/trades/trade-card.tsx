"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/calculations";
import { TradeDrawer } from "./trade-drawer";
import { ClosePositionDialog } from "./close-position-dialog";

interface Position {
  id: string;
  label: string;
  status: string;
  pnl: number;
  isPartial: boolean;
  partialPct: number | null;
  closedAt: Date | null;
}

interface TradeCardProps {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  riskUsd: number;
  riskPct: number;
  entry: number | null;
  stopLoss: number | null;
  size: number | null;
  externalId: string | null;
  notes: string | null;
  imageUrl: string | null;
  openedAt: Date;
  closedAt: Date | null;
  status: string;
  positions: Position[];
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
  size,
  externalId,
  notes,
  imageUrl,
  openedAt,
  closedAt,
  status,
  positions,
}: TradeCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLong = direction === "LONG";
  const dirColor = isLong ? "#4ade80" : "#f87171";
  const openCount = positions.filter((p) => p.status === "OPEN").length;

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#2f3340]"
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: dirColor,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[#d4d4d8] font-black text-base tracking-wide">
              {pair}
            </span>
            {externalId && (
              <span className="text-[#52525b] text-[10px] font-mono">
                #{externalId.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Direction badge */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] rounded border"
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
            {/* Status badge */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] rounded border"
              style={{
                color: status === "OPEN" ? "#5eead4" : "#71717a",
                backgroundColor:
                  status === "OPEN"
                    ? "rgba(94,234,212,0.1)"
                    : "rgba(113,113,122,0.06)",
                borderColor:
                  status === "OPEN"
                    ? "rgba(94,234,212,0.25)"
                    : "rgba(113,113,122,0.2)",
              }}
            >
              {status === "OPEN" ? "Abierto" : "Cerrado"}
            </span>
            <span className="text-[#52525b] text-[10px] font-mono">
              {timeAgo(openedAt)}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-5 gap-3 px-5 py-3">
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Riesgo
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold">
              {formatCurrency(riskUsd)}
            </span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Riesgo%
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold">
              {riskPct.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Entrada
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold">
              {entry?.toFixed(2) ?? "—"}
            </span>
          </div>
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
                    className="font-mono text-sm font-semibold"
                    style={{ color: isBE ? "#fbbf24" : "#f87171" }}
                  >
                    {stopLoss?.toFixed(2) ?? "—"}
                  </span>
                </>
              );
            })()}
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-[2px] text-[#52525b] mb-0.5 font-medium">
              Tamaño
            </span>
            <span className="font-mono text-sm text-[#d4d4d8] font-semibold">
              {size ?? "—"}
            </span>
          </div>
        </div>

        {/* Close button or P&L result */}
        {(() => {
          const openPos = positions.find((p) => p.status === "OPEN");
          const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
          if (openPos) {
            return (
              <div className="px-5 pb-4 pt-2 border-t border-[#252833]" onClick={(e) => e.stopPropagation()}>
                <ClosePositionDialog
                  positionId={openPos.id}
                  positionLabel={pair}
                  riskUsd={riskUsd}
                />
              </div>
            );
          }
          return (
            <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-[#252833]">
              <span className="text-[9px] uppercase tracking-[2px] text-[#52525b] font-medium">
                Resultado
              </span>
              <span
                className="font-mono text-sm font-black"
                style={{ color: pnlColor(totalPnl) }}
              >
                {formatPnlValue(totalPnl)}
              </span>
            </div>
          );
        })()}
      </div>

      <TradeDrawer
        trade={{
          id,
          pair,
          direction,
          entry,
          stopLoss,
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
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
