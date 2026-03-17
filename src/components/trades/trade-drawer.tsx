"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatPnl, formatCurrency } from "@/lib/calculations";
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

interface Trade {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  stopLoss: number | null;
  size: number | null;
  riskUsd: number;
  riskPct: number;
  externalId: string | null;
  notes: string | null;
  imageUrl: string | null;
  openedAt: Date;
  closedAt: Date | null;
  status: string;
  positions: Position[];
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    OPEN: "bg-[#5eead4]/10 text-[#5eead4] border-[#5eead4]/30",
    TP: "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30",
    SL: "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30",
    BE: "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30",
    PARTIAL: "bg-[#5eead4]/10 text-[#5eead4] border-[#5eead4]/30",
  };
  return colors[status] || "bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30";
}

export function TradeDrawer({
  trade,
  open,
  onClose,
}: {
  trade: Trade;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const totalPnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
  const openPositions = trade.positions.filter((p) => p.status === "OPEN");
  const isLong = trade.direction === "LONG";
  const firstClosed = trade.positions[0]?.status;
  const suggestBE = firstClosed === "TP" && openPositions.length > 0;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const pnlColor = totalPnl >= 0 ? "#4ade80" : "#f87171";

  return (
    <div className="fixed inset-0 z-[1000]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="absolute top-0 right-0 h-full w-full max-w-[440px] bg-[#08090c] border-l border-[#252833] overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0e1015] border-b border-[#252833]">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-[#d4d4d8]">{trade.pair}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                isLong
                  ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30"
                  : "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30"
              }`}
            >
              {trade.direction === "LONG" ? "Long" : "Short"}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                trade.status === "OPEN"
                  ? "bg-[#5eead4]/10 text-[#5eead4] border-[#5eead4]/30"
                  : "bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30"
              }`}
            >
              {trade.status === "OPEN" ? "Abierto" : "Cerrado"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* P&L prominente */}
          <div className="text-center py-3">
            <div className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] mb-1 font-mono">P&L Total</div>
            <div
              className="font-mono text-3xl font-bold"
              style={{ color: pnlColor }}
            >
              {formatPnl(totalPnl)}
            </div>
          </div>

          {/* Trade info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCell label="Entrada" value={trade.entry?.toFixed(2) ?? "\u2014"} />
            <InfoCell
              label={
                trade.entry != null &&
                trade.stopLoss != null &&
                ((isLong && trade.stopLoss >= trade.entry) ||
                  (!isLong && trade.stopLoss <= trade.entry))
                  ? "BE"
                  : "SL"
              }
              value={trade.stopLoss?.toFixed(2) ?? "\u2014"}
              color={
                trade.entry != null &&
                trade.stopLoss != null &&
                ((isLong && trade.stopLoss >= trade.entry) ||
                  (!isLong && trade.stopLoss <= trade.entry))
                  ? "#fbbf24"
                  : "#f87171"
              }
            />
            <InfoCell label="Riesgo" value={`${formatCurrency(trade.riskUsd)} (${trade.riskPct.toFixed(1)}%)`} color="#f87171" />
            <InfoCell label="Tamano" value={trade.size?.toString() ?? "\u2014"} />
            <InfoCell label="Abierto" value={formatDate(trade.openedAt)} />
            {trade.closedAt && <InfoCell label="Cerrado" value={formatDate(trade.closedAt)} />}
            {trade.externalId && <InfoCell label="ID Broker" value={trade.externalId} />}
          </div>

          {/* BE suggestion */}
          {suggestBE && (
            <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/5 px-4 py-3 text-[12px] text-[#fbbf24] font-mono">
              Primera posicion cerrada en TP. Considera mover las restantes a Break Even.
            </div>
          )}

          {/* Notes */}
          {trade.notes && (
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-[#52525b] font-semibold font-mono block mb-2">
                Notas
              </span>
              <div className="bg-[#0e1015] border border-[#252833] border-l-2 border-l-[#5eead4] rounded-lg px-4 py-3 text-sm text-[#d4d4d8] whitespace-pre-wrap italic">
                {trade.notes}
              </div>
            </div>
          )}

          {/* Image */}
          {trade.imageUrl && (
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-[#52525b] font-semibold font-mono block mb-2">
                Screenshot
              </span>
              <img
                src={trade.imageUrl}
                alt="Trade screenshot"
                className="rounded-lg max-w-full border border-[#252833]"
              />
            </div>
          )}

          {/* Cerrar trade (al final, solo si esta abierto) */}
          {(() => {
            const pos = trade.positions[0];
            if (!pos || pos.status !== "OPEN") return null;
            return (
              <div className="pt-3 border-t border-[#252833]">
                <ClosePositionDialog
                  positionId={pos.id}
                  positionLabel={trade.pair}
                  riskUsd={trade.riskUsd}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] mb-0.5 font-mono">{label}</div>
      <div
        className="font-mono text-sm"
        style={color ? { color } : { color: "#d4d4d8" }}
      >
        {value}
      </div>
    </div>
  );
}
