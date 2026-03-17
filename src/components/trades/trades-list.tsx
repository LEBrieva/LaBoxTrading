"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { TradeCard } from "./trade-card";
import { getTradesPaginated, getTradesForExport } from "@/lib/actions/trades";
import * as XLSX from "xlsx";

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
  takeProfit: number | null;
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

interface Stats {
  total: number;
  openCount: number;
  wins: number;
  losses: number;
  totalPnl: number;
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED";

const filterBtnClass = (active: boolean) =>
  `px-3 py-1.5 rounded text-[11px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
    active
      ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
      : "text-[#71717a] border border-transparent hover:text-[#d4d4d8] hover:bg-[#14161e]"
  }`;

export function TradesList({
  accountId,
  accountName,
  initialTrades,
  initialHasMore,
  initialStats,
  initialDateFrom = "",
  initialDateTo = "",
}: {
  accountId: string;
  accountName: string;
  initialTrades: Trade[];
  initialHasMore: boolean;
  initialStats: Stats;
  initialDateFrom?: string;
  initialDateTo?: string;
}) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  const hasFilters = statusFilter !== "ALL" || dateFrom || dateTo;

  const fetchTrades = useCallback(async (skip: number, status: StatusFilter, from: string, to: string) => {
    const result = await getTradesPaginated(accountId, {
      status: status === "ALL" ? undefined : status,
      from: from || undefined,
      to: to || undefined,
      skip,
    });
    return result;
  }, [accountId]);

  async function handleExport() {
    setExporting(true);
    try {
      const allTrades = await getTradesForExport(accountId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });

      const formatDate = (d: Date | null) =>
        d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

      const getResultado = (t: typeof allTrades[0]) => {
        if (t.status === "OPEN") return "ABIERTO";
        const statuses = t.positions.map((p) => p.status);
        if (statuses.every((s) => s === "TP")) return "TP";
        if (statuses.every((s) => s === "SL")) return "SL";
        if (statuses.every((s) => s === "BE")) return "BE";
        return "PARCIAL";
      };

      const rows = allTrades.map((t) => ({
        "Fecha Apertura": formatDate(t.openedAt),
        "Fecha Cierre": formatDate(t.closedAt),
        "Par": t.pair,
        "Dirección": t.direction,
        "Estado": t.status === "OPEN" ? "Abierto" : "Cerrado",
        "Entry": t.entry,
        "Stop Loss": t.stopLoss,
        "Take Profit": t.takeProfit,
        "Tamaño": t.size,
        "Riesgo USD": t.riskUsd,
        "Riesgo %": t.riskPct,
        "P&L": t.positions.reduce((s, p) => s + p.pnl, 0),
        "Resultado": getResultado(t),
        "ID Externo": t.externalId || "",
        "Notas": t.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trades");

      const today = new Date().toISOString().split("T")[0];
      const safeName = accountName.replace(/[^a-zA-Z0-9_-]/g, "_");
      XLSX.writeFile(wb, `Trades_${safeName}_${today}.xlsx`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  // Reset when filters change
  useEffect(() => {
    startTransition(async () => {
      const result = await fetchTrades(0, statusFilter, dateFrom, dateTo);
      setTrades(result.trades);
      setHasMore(result.hasMore);
      setStats(result.stats);
    });
  }, [statusFilter, dateFrom, dateTo, fetchTrades]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending && !isLoadingMore.current) {
          isLoadingMore.current = true;
          startTransition(async () => {
            const result = await fetchTrades(trades.length, statusFilter, dateFrom, dateTo);
            setTrades((prev) => [...prev, ...result.trades]);
            setHasMore(result.hasMore);
            isLoadingMore.current = false;
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, trades.length, statusFilter, dateFrom, dateTo, fetchTrades]);

  const sign = stats.totalPnl >= 0 ? "+" : "";
  const wr = (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : "—";

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
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{stats.total}</span>
          </button>
          <button
            onClick={() => setStatusFilter("OPEN")}
            className={filterBtnClass(statusFilter === "OPEN")}
          >
            Abiertos
          </button>
          <button
            onClick={() => setStatusFilter("CLOSED")}
            className={filterBtnClass(statusFilter === "CLOSED")}
          >
            Cerrados
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

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting || stats.total === 0}
          className="ml-auto px-3 py-1.5 rounded text-[11px] uppercase tracking-[1.5px] font-semibold text-[#71717a] border border-[#252833] hover:text-[#5eead4] hover:border-[#5eead4]/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          {exporting ? "Exportando..." : "⬇ Excel"}
        </button>
      </div>

      {/* Summary */}
      {stats.total > 0 && (
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-5 px-4 py-3 bg-[#0e1015] border border-[#252833] rounded-lg font-mono text-[11px]">
          <span className="text-[#d4d4d8]">
            {stats.total} {stats.total === 1 ? "trade" : "trades"}
          </span>
          <span className="text-[#252833]">|</span>
          <span className="text-[#4ade80]">{stats.wins}W</span>
          <span className="text-[#f87171]">{stats.losses}L</span>
          {stats.openCount > 0 && (
            <span className="text-[#5eead4]">{stats.openCount} abiertos</span>
          )}
          <span className="text-[#252833]">|</span>
          <span className={stats.totalPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
            P&L: {sign}${Math.abs(stats.totalPnl).toFixed(2)}
          </span>
          {(stats.wins + stats.losses) > 0 && (
            <>
              <span className="text-[#252833]">|</span>
              <span className="text-[#5eead4]">WR: {wr}%</span>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {trades.length === 0 && !isPending ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            {hasFilters ? "Sin resultados para estos filtros" : "No hay trades registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <TradeCard
              key={trade.id}
              id={trade.id}
              pair={trade.pair}
              direction={trade.direction}
              riskUsd={trade.riskUsd}
              riskPct={trade.riskPct}
              entry={trade.entry}
              stopLoss={trade.stopLoss}
              takeProfit={trade.takeProfit}
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

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading indicator */}
          {isPending && trades.length > 0 && (
            <div className="flex justify-center py-6">
              <span className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono animate-pulse">
                Cargando...
              </span>
            </div>
          )}

          {/* End of list */}
          {!hasMore && trades.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-[10px] text-[#3f3f46] tracking-[2px] uppercase font-mono">
                — Fin —
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
