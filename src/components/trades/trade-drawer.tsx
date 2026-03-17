"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPnl, formatCurrency } from "@/lib/calculations";
import { updateTrade } from "@/lib/actions/trades";
import { addTradeImage, deleteTradeImage } from "@/lib/actions/trade-images";
import { uploadTradeScreenshot } from "@/lib/upload-screenshot";
import { createClient } from "@/lib/supabase/client";
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

interface TradeImage {
  id: string;
  url: string;
  caption: string | null;
  createdAt: Date;
}

interface Trade {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
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
  images: TradeImage[];
}

type Tab = "info" | "screenshots";

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

  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState(trade.entry?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(trade.stopLoss?.toString() ?? "");
  const [takeProfit, setTakeProfit] = useState(trade.takeProfit?.toString() ?? "");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [openedAt, setOpenedAt] = useState(toLocalDatetime(trade.openedAt));

  // Screenshot tab state
  const [uploading, setUploading] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEntry(trade.entry?.toString() ?? "");
    setStopLoss(trade.stopLoss?.toString() ?? "");
    setTakeProfit(trade.takeProfit?.toString() ?? "");
    setNotes(trade.notes ?? "");
    setOpenedAt(toLocalDatetime(trade.openedAt));
  }, [trade, editing]);

  // Reset tab when drawer opens
  useEffect(() => {
    if (open) {
      setTab("info");
      setEditing(false);
    }
  }, [open]);

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

  async function handleSave() {
    setSaving(true);
    try {
      await updateTrade(trade.id, {
        entry: entry ? parseFloat(entry) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
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

  function handleNewFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setNewFile(file);
    if (file) {
      setNewPreview(URL.createObjectURL(file));
    } else {
      setNewPreview(null);
    }
  }

  function resetUploadForm() {
    setNewFile(null);
    setNewPreview(null);
    setNewCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUploadImage() {
    if (!newFile) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const url = await uploadTradeScreenshot(user.id, newFile);
      await addTradeImage(trade.id, url, newCaption || undefined);
      resetUploadForm();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await deleteTradeImage(imageId);
      router.refresh();
    } catch (err) {
      console.error(err);
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
  const imageCount = trade.images.length;

  return (
    <div className="fixed inset-0 z-[1000]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="absolute top-0 right-0 h-full w-full md:max-w-[440px] bg-[#08090c] border-l border-[#252833] flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0e1015] border-b border-[#252833]">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold text-[#d4d4d8]">{trade.pair}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                  isLong
                    ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30"
                    : "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30"
                }`}
              >
                {isLong ? "Long" : "Short"}
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
              {isOpen && tab === "info" && !editing && (
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

          {/* Tabs */}
          <div className="flex px-4 md:px-6 gap-0">
            <button
              onClick={() => { setTab("info"); setEditing(false); }}
              className={`px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold transition-colors relative cursor-pointer ${
                tab === "info" ? "text-[#5eead4]" : "text-[#71717a] hover:text-[#d4d4d8]"
              }`}
            >
              Info
              {tab === "info" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5eead4]" />}
            </button>
            <button
              onClick={() => { setTab("screenshots"); setEditing(false); }}
              className={`px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold transition-colors relative cursor-pointer ${
                tab === "screenshots" ? "text-[#5eead4]" : "text-[#71717a] hover:text-[#d4d4d8]"
              }`}
            >
              Screenshots
              {imageCount > 0 && (
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{imageCount}</span>
              )}
              {tab === "screenshots" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5eead4]" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {tab === "info" ? (
            <>
              {/* P&L */}
              <div className="text-center py-3">
                <div className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] mb-1 font-mono">P&L Total</div>
                <div className="font-mono text-3xl font-bold" style={{ color: pnlColor }}>
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

                {editing ? (
                  <EditCell label="Take Profit" type="number" value={takeProfit} onChange={setTakeProfit} placeholder="Precio TP" />
                ) : (
                  <InfoCell label="TP" value={trade.takeProfit?.toFixed(2) ?? "\u2014"} color="#4ade80" />
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

              {/* Save / Cancel */}
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

              {/* Close trade */}
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
            </>
          ) : (
            /* ── Screenshots Tab ── */
            <>
              {/* Upload form */}
              <div className="bg-[#0e1015] border border-[#252833] rounded-lg p-4 space-y-3">
                <span className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold font-mono">
                  Agregar screenshot
                </span>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#252833] rounded-lg p-4 text-center cursor-pointer hover:border-[#5eead4]/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleNewFile}
                  />
                  {newPreview ? (
                    <div className="space-y-2">
                      <img src={newPreview} alt="Preview" className="max-h-[100px] mx-auto rounded border border-[#252833]" />
                      <p className="text-[10px] text-[#5eead4] font-mono">{newFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[12px] text-[#71717a] font-mono">Click para seleccionar imagen</p>
                      <p className="text-[9px] text-[#52525b] font-mono">PNG, JPG o WebP — max 5MB</p>
                    </div>
                  )}
                </div>

                <input
                  className={inputClass}
                  placeholder="Descripción (ej: Setup pre-entrada, divergencia RSI...)"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  {newFile && (
                    <button
                      type="button"
                      onClick={resetUploadForm}
                      className="px-3 py-1.5 rounded-lg border border-[#252833] text-[#71717a] text-[12px] font-semibold hover:text-[#d4d4d8] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={!newFile || uploading}
                    className="px-4 py-1.5 rounded-lg bg-[#5eead4] text-[#08090c] text-[12px] font-bold hover:brightness-110 transition-all disabled:opacity-30 cursor-pointer"
                  >
                    {uploading ? "Subiendo..." : "Subir"}
                  </button>
                </div>
              </div>

              {/* Image gallery */}
              {trade.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-2xl text-[#252833]">◈</span>
                  <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                    Sin screenshots aún
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trade.images.map((img) => (
                    <div key={img.id} className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.caption || "Trade screenshot"}
                        className="w-full"
                      />
                      <div className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {img.caption && (
                            <p className="text-sm text-[#d4d4d8] italic">{img.caption}</p>
                          )}
                          <p className="text-[9px] text-[#52525b] font-mono mt-1">
                            {new Date(img.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="text-[#52525b] hover:text-[#f87171] text-[10px] font-mono transition-colors shrink-0 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
