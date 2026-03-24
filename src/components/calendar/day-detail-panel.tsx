"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTradesForDay } from "@/lib/actions/trades";
import { getJournalEntry } from "@/lib/actions/journal";
import { JournalEntryDialog } from "@/components/journal/journal-entry-dialog";
import { TradeDrawer } from "@/components/trades/trade-drawer";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MOOD_EMOJI: Record<string, string> = {
  GREAT: "\u{1F525}",
  GOOD: "\u{1F60A}",
  NEUTRAL: "\u{1F610}",
  BAD: "\u{1F61E}",
  TERRIBLE: "\u{1F480}",
};

const MOOD_LABELS: Record<string, string> = {
  GREAT: "Excelente",
  GOOD: "Bien",
  NEUTRAL: "Normal",
  BAD: "Mal",
  TERRIBLE: "Terrible",
};

const MOOD_COLORS: Record<string, string> = {
  GREAT: "#4ade80",
  GOOD: "#5eead4",
  NEUTRAL: "#71717a",
  BAD: "#fb923c",
  TERRIBLE: "#f87171",
};

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

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  tags: string[];
}

interface DayDetailPanelProps {
  dateKey: string;
  accountId: string;
  onClose: () => void;
  onCalendarRefresh: () => void;
}

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function DayDetailPanel({
  dateKey,
  accountId,
  onClose,
  onCalendarRefresh,
}: DayDetailPanelProps) {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const currentDateKey = useRef(dateKey);

  const [y, m, d] = dateKey.split("-").map(Number);
  const dateLabel = `${d} de ${MONTHS[m - 1]}`;

  useEffect(() => {
    currentDateKey.current = dateKey;
    setLoading(true);
    setSelectedTrade(null);

    Promise.all([
      getTradesForDay(accountId, dateKey),
      getJournalEntry(dateKey),
    ]).then(([t, j]) => {
      if (currentDateKey.current !== dateKey) return;
      setTrades(t as Trade[]);
      setJournal(
        j ? { id: j.id, content: j.content, mood: j.mood, tags: j.tags } : null
      );
      setLoading(false);
    });
  }, [dateKey, accountId]);

  function handleJournalSaved() {
    getJournalEntry(dateKey).then((j) => {
      setJournal(
        j ? { id: j.id, content: j.content, mood: j.mood, tags: j.tags } : null
      );
    });
    onCalendarRefresh();
  }

  function handleTradeAction() {
    getTradesForDay(accountId, dateKey).then((t) => setTrades(t as Trade[]));
    onCalendarRefresh();
  }

  const totalPnl = trades.reduce(
    (sum, t) => sum + t.positions.reduce((s, p) => s + p.pnl, 0),
    0
  );

  // -- Desktop panel --
  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252833]">
        <span className="text-sm font-bold text-[#d4d4d8] tracking-tight">
          {dateLabel}
        </span>
        <button
          onClick={onClose}
          className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer"
        >
          &times;
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3 border-b border-[#1a1d27]">
        {trades.length > 0 && (
          <button
            onClick={() => router.push(`/trades?from=${dateKey}&to=${dateKey}`)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#252833] text-[11px] font-semibold text-[#71717a] hover:border-[#5eead4]/40 hover:text-[#5eead4] transition-colors cursor-pointer"
          >
            Ver trades
          </button>
        )}
        {!journal && (
          <button
            onClick={() => setShowJournalDialog(true)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#252833] text-[11px] font-semibold text-[#71717a] hover:border-[#5eead4]/40 hover:text-[#5eead4] transition-colors cursor-pointer"
          >
            Agregar nota
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[10px] text-[#5eead4] uppercase tracking-[2px] font-mono animate-pulse">
              Cargando...
            </span>
          </div>
        ) : (
          <>
            {/* Journal section */}
            {journal && (
              <div className="px-4 py-3 border-b border-[#1a1d27]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold">
                      Nota
                    </span>
                    <span style={{ color: MOOD_COLORS[journal.mood] }}>
                      {MOOD_EMOJI[journal.mood]}
                    </span>
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: MOOD_COLORS[journal.mood] }}
                    >
                      {MOOD_LABELS[journal.mood]}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowJournalDialog(true)}
                    className="text-[#52525b] hover:text-[#5eead4] transition-colors cursor-pointer"
                    title="Editar nota"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
                <p className="text-[12px] text-[#a1a1aa] leading-relaxed whitespace-pre-wrap line-clamp-6">
                  {journal.content}
                </p>
                {journal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {journal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-full bg-[#1a1d27] border border-[#252833] text-[9px] text-[#71717a] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trades section */}
            {trades.length > 0 ? (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold">
                    Trades ({trades.length})
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      totalPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                    }`}
                  >
                    {formatPnl(totalPnl)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {trades.map((trade) => {
                    const pnl = trade.positions.reduce(
                      (s, p) => s + p.pnl,
                      0
                    );
                    const isOpen = trade.status === "OPEN";
                    return (
                      <button
                        key={trade.id}
                        onClick={() => setSelectedTrade(trade)}
                        className="w-full flex items-center justify-between bg-[#14161e] border border-[#1a1d27] rounded-lg px-3 py-2 hover:border-[#5eead4]/30 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold text-[#d4d4d8]">
                            {trade.pair}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              trade.direction === "LONG"
                                ? "bg-[#4ade80]/10 text-[#4ade80]"
                                : "bg-[#f87171]/10 text-[#f87171]"
                            }`}
                          >
                            {trade.direction}
                          </span>
                          {isOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4] animate-pulse" />
                          )}
                        </div>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            pnl > 0
                              ? "text-[#4ade80]"
                              : pnl < 0
                                ? "text-[#f87171]"
                                : "text-[#71717a]"
                          }`}
                        >
                          {trade.status === "CLOSED" ? formatPnl(pnl) : "---"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : !journal ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-2xl text-[#252833]">&#9671;</span>
                <p className="text-[10px] text-[#3f3f46] tracking-[2px] uppercase font-mono">
                  Sin actividad
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: inline panel */}
      <div className="hidden md:flex flex-col w-[380px] border-l border-[#252833] bg-[#0e1015] h-full">
        {panelContent}
      </div>

      {/* Mobile: overlay */}
      <div
        className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-[#0e1015] border-t border-[#252833] rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
          <div className="w-10 h-1 rounded-full bg-[#252833] mx-auto mt-2 mb-1" />
          {panelContent}
        </div>
      </div>

      {/* Journal dialog */}
      {showJournalDialog && (
        <JournalEntryDialog
          dateKey={dateKey}
          onClose={() => setShowJournalDialog(false)}
          onSaved={() => {
            setShowJournalDialog(false);
            handleJournalSaved();
          }}
        />
      )}

      {/* Trade drawer */}
      {selectedTrade && (
        <TradeDrawer
          trade={selectedTrade}
          open={!!selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onTradeUpdated={() => handleTradeAction()}
          onTradeDeleted={() => {
            setSelectedTrade(null);
            handleTradeAction();
          }}
          onPositionClosed={() => handleTradeAction()}
        />
      )}
    </>
  );
}
