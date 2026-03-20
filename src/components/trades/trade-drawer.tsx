"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatPnl, formatCurrency } from "@/lib/calculations";
import { useStats } from "@/contexts/stats-context";
import { DrawerLivePnl } from "./drawer-live-pnl";
import { updateTrade, deleteTrade } from "@/lib/actions/trades";
import { addTradeImage, deleteTradeImage, getTradeImages } from "@/lib/actions/trade-images";
import { getTradeChecklist } from "@/lib/actions/trade-checklist";
import { uploadTradeScreenshot } from "@/lib/upload-screenshot";
import { createClient } from "@/lib/supabase/client";
import { LiveCloseButton } from "./live-close-button";
import { TradeChecklist } from "./trade-checklist";

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
  _count: { images: number };
  checklist?: {
    id: string;
    strategyId: string | null;
    strategy: { id: string; name: string } | null;
  } | null;
}

type Tab = "info" | "screenshots" | "strategy" | "positions";

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
  strategies = [],
  onTradeUpdated,
  onTradeDeleted,
  onTradeRestored,
  onPositionClosed,
}: {
  trade: Trade;
  open: boolean;
  onClose: () => void;
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
}) {
  const { refreshStats } = useStats();
  const totalPnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
  const openPositions = trade.positions.filter((p) => p.status === "OPEN");
  const isLong = trade.direction === "LONG";
  const firstClosed = trade.positions[0]?.status;
  const suggestBE = firstClosed === "TP" && openPositions.length > 0;
  const isOpen = trade.status === "OPEN";
  const dec = 2;

  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  const [entry, setEntry] = useState(trade.entry?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(trade.stopLoss?.toString() ?? "");
  const [takeProfit, setTakeProfit] = useState(trade.takeProfit?.toString() ?? "");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [openedAt, setOpenedAt] = useState(toLocalDatetime(trade.openedAt));

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lazy-loaded data
  const [images, setImages] = useState<TradeImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [fullChecklist, setFullChecklist] = useState<{
    id: string;
    strategyId: string | null;
    strategy: { id: string; name: string; fields: unknown } | null;
    values: unknown;
  } | null>(null);
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  // Screenshot tab state
  const [uploading, setUploading] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setEntry(trade.entry?.toString() ?? "");
      setStopLoss(trade.stopLoss?.toString() ?? "");
      setTakeProfit(trade.takeProfit?.toString() ?? "");
      setNotes(trade.notes ?? "");
      setOpenedAt(toLocalDatetime(trade.openedAt));
    }
  }, [trade, editing]);

  // Reset tab and lazy-load data when drawer opens
  useEffect(() => {
    if (open) {
      setTab("info");
      setEditing(false);
      setConfirmDelete(false);
      setImagesLoaded(false);
      setChecklistLoaded(false);
      setImages([]);
      setFullChecklist(null);

      // Load images and checklist in background
      getTradeImages(trade.id).then((imgs) => {
        setImages(imgs);
        setImagesLoaded(true);
      }).catch(console.error);

      if (trade.checklist?.strategyId) {
        getTradeChecklist(trade.id).then((cl) => {
          setFullChecklist(cl);
          setChecklistLoaded(true);
        }).catch(console.error);
      } else {
        setChecklistLoaded(true);
      }
    }
  }, [open, trade.id, trade.checklist?.strategyId]);

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
    const updates = {
      entry: entry ? parseFloat(entry) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      notes: notes || null,
      openedAt: new Date(openedAt),
    };

    // Optimistic: update UI immediately
    setEditing(false);
    onTradeUpdated?.(trade.id, updates);

    // Server action in background
    try {
      await updateTrade(trade.id, {
        ...updates,
        openedAt,
      });
    } catch (err) {
      console.error(err);
      // Rollback: restore original values and reopen editing
      onTradeUpdated?.(trade.id, {
        entry: trade.entry,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        notes: trade.notes,
        openedAt: trade.openedAt,
      });
      setEditing(true);
      alert("Error al guardar. Intente de nuevo.");
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
      const newImage = await addTradeImage(trade.id, url, newCaption || undefined);
      resetUploadForm();
      const img = { id: newImage.id, url: newImage.url, caption: newImage.caption, createdAt: newImage.createdAt };
      setImages((prev) => [...prev, img]);
      onTradeUpdated?.(trade.id, { _count: { images: images.length + 1 } });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    const prevImages = images;
    setDeletingImageId(imageId);
    // Optimistic: update UI immediately
    setImages((prev) => prev.filter((i) => i.id !== imageId));
    onTradeUpdated?.(trade.id, { _count: { images: images.length - 1 } });
    try {
      await deleteTradeImage(imageId);
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setImages(prevImages);
      onTradeUpdated?.(trade.id, { _count: { images: prevImages.length } });
    } finally {
      setDeletingImageId(null);
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
  const imageCount = imagesLoaded ? images.length : trade._count.images;

  return (
    <div className="fixed inset-0 z-[1000] h-[100dvh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="absolute top-0 right-0 bottom-0 w-full md:max-w-[440px] bg-[#08090c] border-l border-[#252833] flex flex-col animate-in slide-in-from-right duration-200"
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
            <button
              onClick={() => { setTab("strategy"); setEditing(false); }}
              className={`px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold transition-colors relative cursor-pointer ${
                tab === "strategy" ? "text-[#5eead4]" : "text-[#71717a] hover:text-[#d4d4d8]"
              }`}
            >
              Estrategia
              {trade.checklist && <span className="ml-1.5 font-mono text-[10px] opacity-60">✓</span>}
              {tab === "strategy" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5eead4]" />}
            </button>
            {trade.positions.some((p) => p.status !== "OPEN") && (
              <button
                onClick={() => { setTab("positions"); setEditing(false); }}
                className={`px-4 py-2 text-[11px] uppercase tracking-[2px] font-semibold transition-colors relative cursor-pointer ${
                  tab === "positions" ? "text-[#5eead4]" : "text-[#71717a] hover:text-[#d4d4d8]"
                }`}
              >
                Cierres
                <span className="ml-1.5 font-mono text-[10px] opacity-60">
                  {trade.positions.filter((p) => p.status !== "OPEN").length}
                </span>
                {tab === "positions" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5eead4]" />}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {tab === "positions" ? (
            <div className="space-y-3">
              {trade.positions
                .filter((p) => p.status !== "OPEN")
                .map((p) => {
                  const resultMap: Record<string, { label: string; color: string }> = {
                    TP: { label: "TP", color: "#4ade80" },
                    SL: { label: "SL", color: "#f87171" },
                    BE: { label: "BE", color: "#fbbf24" },
                    PARTIAL: { label: "Parcial", color: "#5eead4" },
                  };
                  const cfg = resultMap[p.status] || { label: p.status, color: "#71717a" };
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-[#14161e] border border-[#252833] rounded-lg">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-[2px] rounded border shrink-0"
                        style={{ color: cfg.color, backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40` }}
                      >
                        {cfg.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          {p.size != null && (
                            <span className="font-mono text-sm text-[#d4d4d8] font-semibold">
                              {p.size}
                            </span>
                          )}
                          {p.closePrice != null && (
                            <span className="font-mono text-[11px] text-[#71717a]">
                              a {p.closePrice.toFixed(dec)}
                            </span>
                          )}
                        </div>
                        {p.closedAt && (
                          <span className="text-[9px] text-[#52525b] font-mono">
                            {new Date(p.closedAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-mono text-sm font-black shrink-0 s"
                        style={{ color: p.pnl > 0 ? "#4ade80" : p.pnl < 0 ? "#f87171" : "#71717a" }}
                      >
                        {p.pnl >= 0 ? "+" : ""}{formatCurrency(p.pnl)}
                      </span>
                    </div>
                  );
                })}
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#252833]">
                <span className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">Total</span>
                <span
                  className="font-mono text-base font-black s"
                  style={{
                    color: (() => {
                      const total = trade.positions.filter((p) => p.status !== "OPEN").reduce((s, p) => s + p.pnl, 0);
                      return total > 0 ? "#4ade80" : total < 0 ? "#f87171" : "#71717a";
                    })(),
                  }}
                >
                  {(() => {
                    const total = trade.positions.filter((p) => p.status !== "OPEN").reduce((s, p) => s + p.pnl, 0);
                    return `${total >= 0 ? "+" : ""}${formatCurrency(total)}`;
                  })()}
                </span>
              </div>
            </div>
          ) : tab === "strategy" ? (
            checklistLoaded ? (
              <TradeChecklist
                tradeId={trade.id}
                checklist={fullChecklist || null}
                strategies={strategies}
                onChecklistChanged={(cl) => {
                  onTradeUpdated?.(trade.id, {
                    checklist: cl ? { id: trade.checklist?.id ?? "", strategyId: cl.strategyId, strategy: cl.strategy } : undefined,
                  });
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 animate-pulse">
                <div className="w-6 h-6 border-2 border-[#252833] border-t-[#5eead4] rounded-full animate-spin" />
                <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono">Cargando estrategia...</p>
              </div>
            )
          ) : tab === "info" ? (
            <>
              {/* P&L */}
              {isOpen ? (
                <DrawerLivePnl
                  pair={trade.pair}
                  direction={trade.direction}
                  entry={trade.entry}
                  size={trade.size}
                />
              ) : (
                <div className="text-center py-3">
                  <div className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] mb-1 font-mono">
                    P&L Total
                  </div>
                  <div className="font-mono text-3xl font-bold s" style={{ color: pnlColor }}>
                    {formatPnl(totalPnl)}
                  </div>
                </div>
              )}

              {/* Trade info grid */}
              <div className="grid grid-cols-2 gap-3">
                {editing ? (
                  <EditCell label="Entrada" type="number" value={entry} onChange={setEntry} placeholder="Precio entrada" />
                ) : (
                  <InfoCell label="Entrada" value={trade.entry?.toFixed(dec) ?? "\u2014"} />
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
                    value={trade.stopLoss?.toFixed(dec) ?? "\u2014"}
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
                  <InfoCell label="TP" value={trade.takeProfit?.toFixed(dec) ?? "\u2014"} color="#4ade80" />
                )}

                <InfoCell label="Riesgo" value={`${formatCurrency(trade.riskUsd)} (${trade.riskPct.toFixed(1)}%)`} color="#f87171" sensitive />
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
                    className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              )}

              {/* Close trade */}
              {!editing && (() => {
                const pos = trade.positions[0];
                if (!pos || pos.status !== "OPEN") return null;
                return (
                  <div className="pt-3 border-t border-[#252833]">
                    <LiveCloseButton
                      positionId={pos.id}
                      trade={trade}
                      onPositionClosed={onPositionClosed}
                    />
                  </div>
                );
              })()}

              {/* Delete trade */}
              {!editing && (
                <div className="pt-3 border-t border-[#252833]">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-2 rounded-lg text-[11px] uppercase tracking-[1.5px] font-semibold text-[#52525b] hover:text-[#f87171] transition-colors cursor-pointer"
                    >
                      Eliminar trade
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#f87171] font-mono">Seguro?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 rounded-lg border border-[#252833] text-[#71717a] text-[11px] font-semibold hover:text-[#d4d4d8] transition-colors cursor-pointer"
                        >
                          No
                        </button>
                        <button
                          disabled={deleting}
                          onClick={async () => {
                            setDeleting(true);
                            onClose();
                            onTradeDeleted?.(trade.id);
                            try {
                              await deleteTrade(trade.id);
                              refreshStats();
                            } catch (err) {
                              console.error(err);
                              onTradeRestored?.(trade);
                              alert("Error al eliminar. El trade fue restaurado.");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#f87171] text-[#08090c] text-[11px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {deleting ? "Borrando..." : "Si, eliminar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              {!imagesLoaded ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 animate-pulse">
                  <div className="w-6 h-6 border-2 border-[#252833] border-t-[#5eead4] rounded-full animate-spin" />
                  <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono">Cargando screenshots...</p>
                </div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-2xl text-[#252833]">◈</span>
                  <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                    Sin screenshots aún
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {images.map((img) => (
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
                          disabled={deletingImageId === img.id}
                          className={`text-[10px] font-mono transition-colors shrink-0 cursor-pointer ${
                            deletingImageId === img.id
                              ? "text-[#f87171]/50 cursor-wait"
                              : "text-[#52525b] hover:text-[#f87171]"
                          }`}
                        >
                          {deletingImageId === img.id ? "Eliminando..." : "Eliminar"}
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
  sensitive,
}: {
  label: string;
  value: string;
  color?: string;
  sensitive?: boolean;
}) {
  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-[1px] text-[#52525b] mb-0.5 font-mono">{label}</div>
      <div
        className={`font-mono text-sm${sensitive ? " s" : ""}`}
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
