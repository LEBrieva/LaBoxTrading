"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatPnl, formatCurrency } from "@/lib/calculations";
import { updateTrade } from "@/lib/actions/trades";
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

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";

function toLocalDatetime(d: Date): string {
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
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
  const isOpen = trade.status === "OPEN";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState(trade.entry?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(trade.stopLoss?.toString() ?? "");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [openedAt, setOpenedAt] = useState(toLocalDatetime(trade.openedAt));

  // Reset form state when trade changes or editing toggled off
  useEffect(() => {
    setEntry(trade.entry?.toString() ?? "");
    setStopLoss(trade.stopLoss?.toString() ?? "");
    setNotes(trade.notes ?? "");
    setOpenedAt(toLocalDatetime(trade.openedAt));
  }, [trade, editing]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, editing]
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

  async function handleSave() {
    setSaving(true);
    try {
      await updateTrade(trade.id, {
        entry: entry ? parseFloat(entry) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        notes: notes || null,
        openedAt,
      });
      setEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

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
                isOpen
                  ? "bg-[#5eead4]/10 text-[#5eead4] border-[#5eead4]/30"
                  : "bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30"
              }`}
            >
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOpen && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] uppercase tracking-[1.5px] font-semibold text-[#71717a] hover:text-[#5eead4] px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
              >
                Editar
              </button>
            )}
            <button
              onClick={() => {
                setEditing(false);
                onClose();
              }}
              className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
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
            {editing ? (
              <EditCell label="Entrada" type="number" value={entry} onChange={setEntry} placeholder="Precio entrada" />
            ) : (
              <InfoCell label="Entrada" value={trade.entry?.toFixed(2) ?? "\u2014"} />
            )}

            {editing ? (
              <EditCell label="Stop Loss" type="number" value={stopLoss} onChange={setStopLoss} placeholder="Precio SL" />
            ) : (
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
            )}

            <InfoCell label="Riesgo" value={`${formatCurrency(trade.riskUsd)} (${trade.riskPct.toFixed(1)}%)`} color="#f87171" />
            <InfoCell label="Tamaño" value={trade.size?.toString() ?? "\u2014"} />

            {editing ? (
              <EditCell label="Abierto" type="datetime-local" value={openedAt} onChange={setOpenedAt} />
            ) : (
              <InfoCell label="Abierto" value={formatDate(trade.openedAt)} />
            )}

            {trade.closedAt && <InfoCell label="Cerrado" value={formatDate(trade.closedAt)} />}
            {trade.externalId && <InfoCell label="ID Broker" value={trade.externalId} />}
          </div>

          {/* BE suggestion */}
          {suggestBE && !editing && (
            <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/5 px-4 py-3 text-[12px] text-[#fbbf24] font-mono">
              Primera posición cerrada en TP. Considerá mover a Break Even.
            </div>
          )}

          {/* Notes */}
          {editing ? (
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-[#52525b] font-semibold font-mono block mb-2">
                Notas
              </span>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Notas del trade..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          ) : trade.notes ? (
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-[#52525b] font-semibold font-mono block mb-2">
                Notas
              </span>
              <div className="bg-[#0e1015] border border-[#252833] border-l-2 border-l-[#5eead4] rounded-lg px-4 py-3 text-sm text-[#d4d4d8] whitespace-pre-wrap italic">
                {trade.notes}
              </div>
            </div>
          ) : null}

          {/* Save / Cancel buttons */}
          {editing && (
            <div className="flex justify-end gap-3 pt-2 border-t border-[#252833]">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}

          {/* Image */}
          {!editing && trade.imageUrl && (
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

          {/* Cerrar trade (al final, solo si esta abierto y no editando) */}
          {!editing && (() => {
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

function EditCell({
  label,
  type = "number",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="bg-[#0e1015] border border-[#5eead4]/30 rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-[1px] text-[#5eead4] mb-0.5 font-mono">{label}</div>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-transparent font-mono text-sm text-[#d4d4d8] outline-none placeholder:text-[#52525b]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
