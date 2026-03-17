"use client";

import { useState, useMemo } from "react";
import { TradeCard } from "./trade-card";

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
  images: TradeImage[];
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED";

const filterBtnClass = (active: boolean) =>
  `px-3 py-1.5 rounded text-[11px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
    active
      ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
      : "text-[#71717a] border border-transparent hover:text-[#d4d4d8] hover:bg-[#14161e]"
  }`;

export function TradesList({
  trades,
  initialDateFrom = "",
  initialDateTo = "",
}: {
  trades: Trade[];
  initialDateFrom?: string;
  initialDateTo?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  const filtered = useMemo(() => {
    let result = trades;

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((t) => new Date(t.openedAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      result = result.filter((t) => new Date(t.openedAt) <= to);
    }

    return result;
  }, [trades, statusFilter, dateFrom, dateTo]);

  const openCount = trades.filter((t) => t.status === "OPEN").length;
  const closedCount = trades.filter((t) => t.status === "CLOSED").length;
  const hasFilters = statusFilter !== "ALL" || dateFrom || dateTo;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 mb-6">
        {/* Status filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={filterBtnClass(statusFilter === "ALL")}
          >
            Todos
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{trades.length}</span>
          </button>
          <button
            onClick={() => setStatusFilter("OPEN")}
            className={filterBtnClass(statusFilter === "OPEN")}
          >
            Abiertos
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{openCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter("CLOSED")}
            className={filterBtnClass(statusFilter === "CLOSED")}
          >
            Cerrados
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{closedCount}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-[#252833]" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <label
            className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold cursor-pointer"
            onClick={() => (document.getElementById("filter-from") as HTMLInputElement)?.showPicker()}
          >
            Desde
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDateFrom(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 min-w-0 bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-2.5 py-1.5 rounded font-mono text-[11px] outline-none transition-colors focus:border-[#5eead4] cursor-pointer"
          />
          <label
            className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold cursor-pointer"
            onClick={() => (document.getElementById("filter-to") as HTMLInputElement)?.showPicker()}
          >
            Hasta
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDateTo(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 min-w-0 bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-2.5 py-1.5 rounded font-mono text-[11px] outline-none transition-colors focus:border-[#5eead4] cursor-pointer"
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-[10px] text-[#71717a] hover:text-[#d4d4d8] transition-colors font-mono"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (() => {
        const closedFiltered = filtered.filter((t) => t.status === "CLOSED");
        const totalPnl = closedFiltered.reduce(
          (s, t) => s + t.positions.reduce((sp, p) => sp + p.pnl, 0), 0
        );
        const wins = closedFiltered.filter(
          (t) => t.positions.reduce((s, p) => s + p.pnl, 0) > 0
        ).length;
        const losses = closedFiltered.filter(
          (t) => t.positions.reduce((s, p) => s + p.pnl, 0) < 0
        ).length;
        const wr = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "—";
        const openFiltered = filtered.filter((t) => t.status === "OPEN").length;
        const sign = totalPnl >= 0 ? "+" : "";

        return (
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-5 px-4 py-3 bg-[#0e1015] border border-[#252833] rounded-lg font-mono text-[11px]">
            <span className="text-[#d4d4d8]">
              {filtered.length} {filtered.length === 1 ? "trade" : "trades"}
            </span>
            <span className="text-[#252833]">|</span>
            <span className="text-[#4ade80]">{wins}W</span>
            <span className="text-[#f87171]">{losses}L</span>
            {openFiltered > 0 && (
              <span className="text-[#5eead4]">{openFiltered} abiertos</span>
            )}
            <span className="text-[#252833]">|</span>
            <span className={totalPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
              P&L: {sign}${Math.abs(totalPnl).toFixed(2)}
            </span>
            {(wins + losses) > 0 && (
              <>
                <span className="text-[#252833]">|</span>
                <span className="text-[#5eead4]">WR: {wr}%</span>
              </>
            )}
          </div>
        );
      })()}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            {hasFilters ? "Sin resultados para estos filtros" : "No hay trades registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((trade) => (
            <TradeCard
              key={trade.id}
              id={trade.id}
              pair={trade.pair}
              direction={trade.direction}
              riskUsd={trade.riskUsd}
              riskPct={trade.riskPct}
              entry={trade.entry}
              stopLoss={trade.stopLoss}
              size={trade.size}
              externalId={trade.externalId}
              notes={trade.notes}
              imageUrl={trade.imageUrl}
              openedAt={trade.openedAt}
              closedAt={trade.closedAt}
              status={trade.status}
              positions={trade.positions}
              images={trade.images}
            />
          ))}
        </div>
      )}
    </div>
  );
}
