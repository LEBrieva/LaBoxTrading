"use client";

import { useState, useEffect, useRef, useCallback, useTransition, useMemo } from "react";
import { TradeCard } from "./trade-card";
import { TradesSummary } from "./trades-summary";
import { getTradesPaginated, getTradesForExport } from "@/lib/actions/trades";

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

interface Stats {
  total: number;
  openCount: number;
  wins: number;
  losses: number;
  totalPnl: number;
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED";
type ResultFilter = "ALL" | "TP" | "SL" | "BE";

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
  pairs = [],
  strategies = [],
}: {
  accountId: string;
  accountName: string;
  initialTrades: Trade[];
  initialHasMore: boolean;
  initialStats: Stats;
  initialDateFrom?: string;
  initialDateTo?: string;
  pairs?: string[];
  strategies?: { id: string; name: string; fields: unknown }[];
}) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [pairFilter, setPairFilter] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("");
  const [externalIdFilter, setExternalIdFilter] = useState("");
  const [externalIdInput, setExternalIdInput] = useState("");
  const externalIdTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  // ── Optimistic update callbacks ──

  const handleTradeUpdated = useCallback((tradeId: string, updates: Partial<Trade>) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, ...updates } : t))
    );
  }, []);

  const handleTradeDeleted = useCallback((tradeId: string) => {
    setTrades((prev) => {
      const trade = prev.find((t) => t.id === tradeId);
      if (trade) {
        setStats((s) => ({
          ...s,
          total: s.total - 1,
          openCount: trade.status === "OPEN" ? s.openCount - 1 : s.openCount,
        }));
      }
      return prev.filter((t) => t.id !== tradeId);
    });
  }, []);

  const handleTradeRestored = useCallback((trade: Trade) => {
    setTrades((prev) => {
      if (prev.some((t) => t.id === trade.id)) return prev;
      const updated = [...prev, trade].sort((a, b) => {
        if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
        return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
      });
      setStats((s) => ({
        ...s,
        total: s.total + 1,
        openCount: trade.status === "OPEN" ? s.openCount + 1 : s.openCount,
      }));
      return updated;
    });
  }, []);

  const handlePositionClosed = useCallback(
    (
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
    ) => {
      setTrades((prev) => {
        let tradeBecomesFullyClosed = false;
        const closedAtDate = closedPosition.closedAt ? new Date(closedPosition.closedAt) : new Date();

        const updated = prev.map((t) => {
          if (t.id !== tradeId) return t;

          let finalPositions;

          if (closedPosition.status === "PARTIAL" && closedPosition.partialPct) {
            // PARTIAL: keep original position OPEN with reduced size, add new PARTIAL position
            const closedSize = (t.size ?? 0) * (closedPosition.partialPct / 100);
            const remaining = (t.size ?? 0) * (1 - closedPosition.partialPct / 100);

            finalPositions = t.positions.map((p) => {
              if (p.id !== positionId) return p;
              return { ...p, size: Math.round(remaining * 1e8) / 1e8 };
            });

            finalPositions.push({
              id: `temp-${Date.now()}`,
              label: `Posicion ${t.positions.length + 1}`,
              status: "PARTIAL",
              size: Math.round(closedSize * 1e8) / 1e8,
              pnl: closedPosition.pnl,
              closePrice: closedPosition.closePrice ?? null,
              closedAt: closedAtDate,
              isPartial: true,
              partialPct: closedPosition.partialPct,
            });
          } else {
            // FULL CLOSE (TP/SL/BE): update position in-place
            finalPositions = t.positions.map((p) => {
              if (p.id !== positionId) return p;
              return {
                ...p,
                status: closedPosition.status,
                pnl: closedPosition.pnl,
                closePrice: closedPosition.closePrice ?? p.closePrice,
                closedAt: closedAtDate,
                isPartial: false,
                partialPct: null,
              };
            });

            // If SL, close ALL remaining open positions
            if (closedPosition.status === "SL") {
              finalPositions = finalPositions.map((p) =>
                p.status === "OPEN"
                  ? { ...p, status: "SL", pnl: 0, closedAt: closedAtDate }
                  : p
              );
            }
          }

          // Only OPEN positions indicate remaining exposure
          const allClosed = finalPositions.every((p) => p.status !== "OPEN");

          if (t.status === "OPEN" && allClosed) {
            tradeBecomesFullyClosed = true;
          }

          return {
            ...t,
            positions: finalPositions,
            ...(allClosed && {
              status: "CLOSED",
              closedAt: closedAtDate,
            }),
            ...tradeUpdates,
          };
        });

        // Adjust stats inside the same synchronous block
        if (tradeBecomesFullyClosed) {
          setStats((s) => ({ ...s, openCount: s.openCount - 1 }));
        }

        // Re-sort to match server order: OPEN first, then by openedAt desc
        const statusOrder: Record<string, number> = { OPEN: 0, CLOSED: 1 };
        return updated.sort((a, b) => {
          const s = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
          if (s !== 0) return s;
          return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
        });
      });
    },
    []
  );

  // Sync with server data — only if there are genuinely new trades (e.g. after creating one)
  // Skip if initialTrades is just a subset of what we already have (edit/delete/close revalidation)
  useEffect(() => {
    const currentIds = new Set(trades.map((t) => t.id));
    const hasNewTrades = initialTrades.some((t) => !currentIds.has(t.id));

    if (!hasNewTrades) return;

    if (statusFilter === "ALL" && !dateFrom && !dateTo) {
      setTrades(initialTrades);
      setHasMore(initialHasMore);
      setStats(initialStats);
    } else {
      startTransition(async () => {
        const result = await fetchTrades(undefined, statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo);
        setTrades(result.trades);
        setHasMore(result.hasMore);
        setStats(result.stats);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrades, initialHasMore, initialStats]);
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  const hasFilters = statusFilter !== "ALL" || resultFilter !== "ALL" || pairFilter || strategyFilter || externalIdFilter || dateFrom || dateTo;
  const prevFiltersRef = useRef({ statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo });

  const fetchTrades = useCallback(async (cursor: string | undefined, status: StatusFilter, resultF: ResultFilter, pair: string, strategy: string, extId: string, from: string, to: string) => {
    const result = await getTradesPaginated(accountId, {
      status: status === "ALL" ? undefined : status,
      result: resultF === "ALL" ? undefined : resultF,
      pair: pair || undefined,
      strategyId: strategy || undefined,
      externalId: extId || undefined,
      from: from || undefined,
      to: to || undefined,
      cursor,
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

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trades");

      const today = new Date().toISOString().split("T")[0];
      const safeName = accountName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 50) || "export";
      XLSX.writeFile(wb, `Trades_${safeName}_${today}.xlsx`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  // Reset when filters change — compare with previous values to skip redundant fetches
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.statusFilter !== statusFilter ||
      prev.resultFilter !== resultFilter ||
      prev.pairFilter !== pairFilter ||
      prev.strategyFilter !== strategyFilter ||
      prev.externalIdFilter !== externalIdFilter ||
      prev.dateFrom !== dateFrom ||
      prev.dateTo !== dateTo;

    prevFiltersRef.current = { statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo };

    if (!changed) return;

    startTransition(async () => {
      const result = await fetchTrades(undefined, statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo);
      setTrades(result.trades);
      setHasMore(result.hasMore);
      setStats(result.stats);
    });
  }, [statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo, fetchTrades]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending && !isLoadingMore.current) {
          isLoadingMore.current = true;
          startTransition(async () => {
            const lastId = trades[trades.length - 1]?.id;
            const result = await fetchTrades(lastId, statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo);
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
  }, [hasMore, isPending, trades.length, statusFilter, resultFilter, pairFilter, strategyFilter, externalIdFilter, dateFrom, dateTo, fetchTrades]);

  const openTrades = useMemo(
    () => trades.filter((t) => t.status === "OPEN"),
    [trades]
  );

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

        {/* Result filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setResultFilter("ALL")}
            className={filterBtnClass(resultFilter === "ALL")}
          >
            Todos
          </button>
          <button
            onClick={() => setResultFilter("TP")}
            className={`${filterBtnClass(resultFilter === "TP")} ${resultFilter === "TP" ? "!bg-[#4ade80]/10 !text-[#4ade80] !border-[#4ade80]/30" : ""}`}
          >
            TP
          </button>
          <button
            onClick={() => setResultFilter("SL")}
            className={`${filterBtnClass(resultFilter === "SL")} ${resultFilter === "SL" ? "!bg-[#f87171]/10 !text-[#f87171] !border-[#f87171]/30" : ""}`}
          >
            SL
          </button>
          <button
            onClick={() => setResultFilter("BE")}
            className={`${filterBtnClass(resultFilter === "BE")} ${resultFilter === "BE" ? "!bg-[#fbbf24]/10 !text-[#fbbf24] !border-[#fbbf24]/30" : ""}`}
          >
            BE
          </button>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-[#252833]" />

        {/* Pair filter */}
        {pairs.length > 0 && (
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-2.5 py-1.5 rounded font-mono text-[11px] outline-none transition-colors focus:border-[#5eead4] cursor-pointer"
          >
            <option value="">Todos los pares</option>
            {pairs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        {/* Strategy filter */}
        {strategies.length > 0 && (
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-2.5 py-1.5 rounded font-mono text-[11px] outline-none transition-colors focus:border-[#5eead4] cursor-pointer"
          >
            <option value="">Todas las estrategias</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Broker ID search */}
        <input
          type="text"
          value={externalIdInput}
          onChange={(e) => {
            const val = e.target.value;
            setExternalIdInput(val);
            if (externalIdTimerRef.current) clearTimeout(externalIdTimerRef.current);
            externalIdTimerRef.current = setTimeout(() => setExternalIdFilter(val.trim()), 400);
          }}
          placeholder="Buscar por Broker ID"
          className="bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-2.5 py-1.5 rounded font-mono text-[11px] outline-none transition-colors focus:border-[#5eead4] placeholder:text-[#52525b] w-36"
        />

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
              setResultFilter("ALL");
              setPairFilter("");
              setStrategyFilter("");
              setExternalIdFilter("");
              setExternalIdInput("");
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

      {/* Summary — live P&L updates via usePrices() */}
      <TradesSummary stats={stats} openTrades={openTrades} statusFilter={statusFilter} />

      {/* Results */}
      {trades.length === 0 && !isPending ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            {hasFilters ? "Sin resultados para estos filtros" : "No hay trades registrados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
              _count={trade._count}
              checklist={trade.checklist}
              strategies={strategies}
              onTradeUpdated={handleTradeUpdated}
              onTradeDeleted={handleTradeDeleted}
              onTradeRestored={handleTradeRestored}
              onPositionClosed={handlePositionClosed}
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
