"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTrade } from "@/lib/actions/trades";
import { addTradeImage } from "@/lib/actions/trade-images";
import { calcRiskUsd, calcRiskPct, calcTpPrice, calcEstimatedGain } from "@/lib/calculations";
import { uploadTradeScreenshot } from "@/lib/upload-screenshot";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass = "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

interface TradeFormProps {
  accountId: string;
  currentCapital: number;
}

export function TradeForm({ accountId, currentCapital }: TradeFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [size, setSize] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [riskUsd, setRiskUsd] = useState(calcRiskUsd(currentCapital, 1).toFixed(2));
  const [externalId, setExternalId] = useState("");
  const [notes, setNotes] = useState("");
  const [ratio, setRatio] = useState("3");
  const [openedAt, setOpenedAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleRiskPctChange(val: string) {
    setRiskPct(val);
    const pct = parseFloat(val);
    if (!isNaN(pct)) setRiskUsd(calcRiskUsd(currentCapital, pct).toFixed(2));
  }

  function handleRiskUsdChange(val: string) {
    setRiskUsd(val);
    const usd = parseFloat(val);
    if (!isNaN(usd)) setRiskPct(calcRiskPct(currentCapital, usd).toFixed(2));
  }

  const entryNum = parseFloat(entry);
  const slNum = parseFloat(stopLoss);
  const ratioNum = parseFloat(ratio);
  const tpPrice =
    !isNaN(entryNum) && !isNaN(slNum) && !isNaN(ratioNum)
      ? calcTpPrice(entryNum, slNum, ratioNum, direction)
      : null;
  const estimatedGain =
    !isNaN(parseFloat(riskUsd)) && !isNaN(ratioNum)
      ? calcEstimatedGain(parseFloat(riskUsd), ratioNum)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const trade = await createTrade({
        accountId,
        pair,
        direction,
        entry: entry ? parseFloat(entry) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        size: size ? parseFloat(size) : undefined,
        riskUsd: parseFloat(riskUsd),
        riskPct: parseFloat(riskPct),
        externalId: externalId || undefined,
        notes: notes || undefined,
        openedAt: openedAt ? new Date(openedAt).toISOString() : undefined,
      });

      if (imageFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const url = await uploadTradeScreenshot(user.id, imageFile);
          await addTradeImage(trade.id, url);
        }
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setPair("");
    setDirection("LONG");
    setEntry("");
    setStopLoss("");
    setSize("");
    setRiskPct("1");
    setRiskUsd(calcRiskUsd(currentCapital, 1).toFixed(2));
    setExternalId("");
    setNotes("");
    setRatio("3");
    setOpenedAt("");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#5eead4] text-[#08090c] px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide hover:brightness-110 transition-all hover:-translate-y-[1px] cursor-pointer"
      >
        + Nuevo trade
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#252833]">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Nuevo trade
              </span>
              <button onClick={() => setOpen(false)} className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Par + Direccion */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Par / Instrumento</label>
                  <input
                    className={inputClass}
                    placeholder="US500, XAUUSD..."
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Direccion</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDirection("LONG")}
                      className={`py-2.5 rounded-lg border font-bold text-[13px] transition-all ${
                        direction === "LONG"
                          ? "bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]"
                          : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27] hover:text-[#d4d4d8]"
                      }`}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("SHORT")}
                      className={`py-2.5 rounded-lg border font-bold text-[13px] transition-all ${
                        direction === "SHORT"
                          ? "bg-[#f87171]/10 border-[#f87171] text-[#f87171]"
                          : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27] hover:text-[#d4d4d8]"
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>
              </div>

              {/* Entry + SL */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Precio de entrada</label>
                  <input className={inputClass} type="number" step="any" placeholder="0.00" value={entry} onChange={(e) => setEntry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Stop Loss</label>
                  <input className={inputClass} type="number" step="any" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                </div>
              </div>

              {/* Size + External ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Tamaño (lots)</label>
                  <input className={inputClass} type="number" step="any" placeholder="0.01" value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>ID Broker (opcional)</label>
                  <input className={inputClass} placeholder="Ej: 324786125" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
                </div>
              </div>

              {/* Risk % + Risk USD */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Riesgo en % del capital</label>
                  <input className={inputClass} type="number" step="0.1" min="0.1" max="10" value={riskPct} onChange={(e) => handleRiskPctChange(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Riesgo en USD</label>
                  <input className={inputClass} type="number" step="0.01" min="0.1" value={riskUsd} onChange={(e) => handleRiskUsdChange(e.target.value)} required />
                </div>
              </div>

              {/* Risk Calc */}
              <div className="grid grid-cols-3 gap-3 bg-[#14161e] border border-[#252833] rounded-lg p-3">
                <div>
                  <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] mb-1 font-mono">Riesgo total</div>
                  <div className="font-mono text-[13px] font-bold text-[#f87171]">
                    {riskUsd ? `-$${parseFloat(riskUsd).toFixed(2)}` : "\u2014"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] mb-1 font-mono">Distancia SL</div>
                  <div className="font-mono text-[13px] text-[#71717a]">
                    {!isNaN(entryNum) && !isNaN(slNum) ? `${Math.abs(entryNum - slNum).toFixed(2)} pts` : "\u2014"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] mb-1 font-mono">Potencial TP</div>
                  <div className="font-mono text-[13px] font-bold text-[#4ade80]">
                    {riskUsd ? `+$${parseFloat(riskUsd).toFixed(2)}` : "\u2014"}
                  </div>
                </div>
              </div>

              {/* Ratio Calculator */}
              <div className="bg-[#14161e] border border-[#252833] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold mb-3 font-mono">
                  Calculadora de ratio - precio TP
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <div className="text-[10px] text-[#52525b] mb-1 font-mono">Ratio (ej: 1, 3, 8)</div>
                    <input className={`${inputClass} !py-1.5 !text-[12px]`} type="number" step="any" min="0.1" value={ratio} onChange={(e) => setRatio(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#52525b] mb-1 font-mono">Precio TP resultante</div>
                    <div className="font-mono text-sm font-bold py-1.5 text-[#4ade80]">
                      {tpPrice !== null ? tpPrice.toFixed(2) : "\u2014"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#52525b] mb-1 font-mono">Ganancia estimada</div>
                    <div className="font-mono text-sm font-bold py-1.5 text-[#4ade80]">
                      {estimatedGain !== null ? `+$${estimatedGain.toFixed(2)}` : "\u2014"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fecha de apertura */}
              <div className="space-y-1.5">
                <label className={labelClass}>Fecha de apertura (opcional)</label>
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={openedAt}
                  onChange={(e) => setOpenedAt(e.target.value)}
                />
                <p className="text-[9px] text-[#52525b] font-mono">Deja vacio para usar la fecha actual</p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className={labelClass}>Notas (opcional)</label>
                <input
                  className={inputClass}
                  placeholder="Ej: divergencia horaria, nodo LVN en 5400..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Screenshot */}
              <div className="space-y-1.5">
                <label className={labelClass}>Screenshot (opcional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#252833] rounded-lg p-4 text-center cursor-pointer hover:border-[#5eead4]/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="max-h-[120px] mx-auto rounded border border-[#252833]" />
                      <p className="text-[10px] text-[#5eead4] font-mono">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[12px] text-[#71717a] font-mono">Click para subir imagen</p>
                      <p className="text-[9px] text-[#52525b] font-mono">PNG, JPG o WebP — max 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
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
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all hover:-translate-y-[1px] disabled:opacity-50"
                >
                  {loading ? "Abriendo..." : "Abrir trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
