"use client";

import { useState, useEffect } from "react";
import { closePosition } from "@/lib/actions/trades";
import { useStats } from "@/contexts/stats-context";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass = "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold";

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

interface ClosePositionDialogProps {
  positionId: string;
  positionLabel: string;
  riskUsd: number;
  livePrice?: number | null;
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
  trade?: Trade;
}

export function ClosePositionDialog({
  positionId,
  positionLabel,
  riskUsd,
  livePrice,
  onPositionClosed,
  trade,
}: ClosePositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"TP" | "SL" | "BE" | "PARTIAL">("TP");
  const [pnl, setPnl] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [partialPct, setPartialPct] = useState("50");
  const [closedAt, setClosedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshStats } = useStats();

  // Pre-fill exit price with live price when dialog opens
  useEffect(() => {
    if (open && livePrice != null && exitPrice === "") {
      setExitPrice(livePrice.toString());
    }
  }, [open, livePrice, exitPrice]);

  function handleResultChange(val: "TP" | "SL" | "BE" | "PARTIAL") {
    setResult(val);
    if (val === "SL") {
      setPnl((-riskUsd).toFixed(2));
    } else if (val === "BE") {
      setPnl("0");
    } else {
      setPnl("");
    }
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await closePosition(
        positionId,
        result,
        parseFloat(pnl),
        result === "PARTIAL" ? parseFloat(partialPct) : undefined,
        closedAt || undefined,
        exitPrice ? parseFloat(exitPrice) : undefined
      );
      setOpen(false);
      setExitPrice("");

      // Build trade-level updates for partial closes (size reduction)
      let tradeUpdates: Partial<Trade> | undefined;
      if (result === "PARTIAL" && trade && trade.size != null) {
        const pctVal = parseFloat(partialPct);
        const remaining = trade.size * (1 - pctVal / 100);
        tradeUpdates = { size: Math.round(remaining * 1e8) / 1e8 };
      }

      if (onPositionClosed && trade) {
        onPositionClosed(
          trade.id,
          positionId,
          {
            status: result,
            pnl: parseFloat(pnl),
            closePrice: exitPrice ? parseFloat(exitPrice) : undefined,
            closedAt: closedAt || new Date().toISOString(),
            partialPct: result === "PARTIAL" ? parseFloat(partialPct) : undefined,
          },
          tradeUpdates
        );
      }

      refreshStats();
    } catch (err) {
      console.error("Error closing position:", err);
      alert("Error al cerrar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  const resultOptions: { value: "TP" | "SL" | "BE" | "PARTIAL"; label: string; color: string }[] = [
    { value: "TP", label: "Take Profit", color: "#4ade80" },
    { value: "SL", label: "Stop Loss", color: "#f87171" },
    { value: "BE", label: "Break Even", color: "#fbbf24" },
    { value: "PARTIAL", label: "Parcial", color: "#5eead4" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-lg border border-[#252833] text-[#d4d4d8] text-[13px] font-semibold hover:border-[#f87171] hover:text-[#f87171] transition-colors cursor-pointer"
      >
        Cerrar trade
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[380px] max-w-[95vw] max-h-[95vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#252833]">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">Cerrar {positionLabel}</span>
              <button onClick={() => setOpen(false)} className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleClose} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className={labelClass}>Resultado</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {resultOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleResultChange(opt.value)}
                      className={`py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all ${
                        result === opt.value
                          ? ""
                          : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27]"
                      }`}
                      style={
                        result === opt.value
                          ? { borderColor: opt.color, color: opt.color, backgroundColor: `${opt.color}15` }
                          : undefined
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Precio de cierre</label>
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="Precio al cerrar"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>P&L (USD)</label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  required
                  placeholder={result === "TP" ? "Monto ganado" : "0.00"}
                  autoFocus
                />
              </div>

              {result === "PARTIAL" && (
                <div className="space-y-1.5">
                  <label className={labelClass}>% del tramo cerrado</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="1"
                    min="1"
                    max="99"
                    value={partialPct}
                    onChange={(e) => setPartialPct(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className={labelClass}>Fecha de cierre (opcional)</label>
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={closedAt}
                  onChange={(e) => setClosedAt(e.target.value)}
                />
                <p className="text-[9px] text-[#52525b] font-mono">Deja vacio para usar la fecha actual</p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#252833]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? "Cerrando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
