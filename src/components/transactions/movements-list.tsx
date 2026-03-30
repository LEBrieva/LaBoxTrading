"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
import { getTimelineData, type TimelineEntry } from "@/lib/actions/stats";
import { deleteTransaction } from "@/lib/actions/transactions";
import { MovementRow } from "./movement-row";
import { TransactionForm } from "./transaction-form";

type TypeFilter = "ALL" | "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "TRADE";

const filterBtnClass = (active: boolean) =>
  `px-3 py-1.5 rounded text-[11px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
    active
      ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
      : "text-[#71717a] border border-transparent hover:text-[#d4d4d8] hover:bg-[#14161e]"
  }`;

export function MovementsList({
  accountId,
  initialEntries,
  initialHasMore,
}: {
  accountId: string;
  initialEntries: TimelineEntry[];
  initialHasMore: boolean;
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [isPending, startTransition] = useTransition();
  const [editEntry, setEditEntry] = useState<TimelineEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  const filteredEntries = useMemo(
    () => typeFilter === "ALL" ? entries : entries.filter((e) => e.type === typeFilter),
    [entries, typeFilter]
  );

  const refreshData = useCallback(() => {
    startTransition(async () => {
      const result = await getTimelineData(accountId);
      setEntries(result.entries);
      setHasMore(result.hasMore);
    });
  }, [accountId]);

  // Sync with server on initial data change
  useEffect(() => {
    setEntries(initialEntries);
    setHasMore(initialHasMore);
  }, [initialEntries, initialHasMore]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting && hasMore && !isPending && !isLoadingMore.current) {
          isLoadingMore.current = true;
          const lastId = entries[entries.length - 1]?.id;
          startTransition(async () => {
            const result = await getTimelineData(accountId, lastId);
            setEntries((prev) => [...prev, ...result.entries]);
            setHasMore(result.hasMore);
            isLoadingMore.current = false;
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, entries.length, accountId]);

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    // Optimistic remove
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
    try {
      await deleteTransaction(id);
      refreshData();
    } catch (err) {
      console.error(err);
      refreshData();
    }
  }

  function handleEdit(entry: TimelineEntry) {
    setEditEntry(entry);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const typeLabel: Record<string, string> = {
        DEPOSIT: "Depósito",
        WITHDRAWAL: "Retiro",
        TRADE: "Trade",
      };

      const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

      const rows = filteredEntries.map((e) => ({
        Fecha: formatDate(e.date),
        Tipo: typeLabel[e.type] || e.type,
        Detalle: e.label,
        Monto: e.amount,
        Balance: e.balance,
        Nota: e.note || "",
      }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Movimientos");

      const today = new Date().toISOString().split("T")[0];
      const filterSuffix = typeFilter !== "ALL" ? `_${typeFilter}` : "";
      XLSX.writeFile(wb, `Movimientos${filterSuffix}_${today}.xlsx`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => setTypeFilter("ALL")} className={filterBtnClass(typeFilter === "ALL")}>
            Todos
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{entries.length}</span>
          </button>
          <button
            onClick={() => setTypeFilter("DEPOSIT")}
            className={`${filterBtnClass(typeFilter === "DEPOSIT")} ${typeFilter === "DEPOSIT" ? "!bg-[#4ade80]/10 !text-[#4ade80] !border-[#4ade80]/30" : ""}`}
          >
            Depósitos
          </button>
          <button
            onClick={() => setTypeFilter("WITHDRAWAL")}
            className={`${filterBtnClass(typeFilter === "WITHDRAWAL")} ${typeFilter === "WITHDRAWAL" ? "!bg-[#f87171]/10 !text-[#f87171] !border-[#f87171]/30" : ""}`}
          >
            Retiros
          </button>
          <button
            onClick={() => setTypeFilter("ADJUSTMENT")}
            className={`${filterBtnClass(typeFilter === "ADJUSTMENT")} ${typeFilter === "ADJUSTMENT" ? "!bg-[#fbbf24]/10 !text-[#fbbf24] !border-[#fbbf24]/30" : ""}`}
          >
            Ajustes
          </button>
          <button
            onClick={() => setTypeFilter("TRADE")}
            className={`${filterBtnClass(typeFilter === "TRADE")} ${typeFilter === "TRADE" ? "!bg-[#5eead4]/10 !text-[#5eead4] !border-[#5eead4]/30" : ""}`}
          >
            Trades
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting || filteredEntries.length === 0}
          className="ml-auto px-3 py-1.5 rounded text-[11px] uppercase tracking-[1.5px] font-semibold text-[#71717a] border border-[#252833] hover:text-[#5eead4] hover:border-[#5eead4]/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          {exporting ? "Exportando..." : "⬇ Excel"}
        </button>
      </div>

      {/* Table header */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 mb-2 text-[9px] uppercase tracking-[2px] text-[#52525b] font-semibold">
        <span className="min-w-[70px]">Fecha</span>
        <span className="min-w-[70px]">Tipo</span>
        <span className="flex-1">Detalle</span>
        <span className="min-w-[90px] text-right">Monto</span>
        <span className="min-w-[80px] text-right">Balance</span>
        <span className="min-w-[40px]" />
      </div>

      {/* List */}
      {filteredEntries.length === 0 && !isPending ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            {typeFilter !== "ALL" ? "Sin movimientos de este tipo" : "No hay movimientos registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <div key={entry.id}>
              <MovementRow
                entry={entry}
                onEdit={entry.type !== "TRADE" ? handleEdit : undefined}
                onDelete={entry.type !== "TRADE" ? handleDelete : undefined}
              />
              {confirmDeleteId === entry.id && (
                <div className="flex items-center justify-end gap-2 mt-1 px-4">
                  <span className="text-[11px] text-[#f87171] font-mono">¿Eliminar?</span>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 rounded text-[10px] text-[#71717a] border border-[#252833] hover:text-[#d4d4d8] transition-colors cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="px-2 py-1 rounded text-[10px] bg-[#f87171] text-[#08090c] font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {isPending && entries.length > 0 && (
            <div className="flex justify-center py-6">
              <span className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono animate-pulse">
                Cargando...
              </span>
            </div>
          )}

          {!hasMore && entries.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-[10px] text-[#3f3f46] tracking-[2px] uppercase font-mono">
                — Fin —
              </span>
            </div>
          )}
        </div>
      )}

      {/* Edit dialog */}
      {editEntry && (
        <TransactionForm
          accountId={accountId}
          editData={{
            id: editEntry.id,
            type: editEntry.type as "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT",
            amount: Math.abs(editEntry.amount),
            date: editEntry.date,
            note: editEntry.note,
          }}
          onSuccess={() => {
            setEditEntry(null);
            refreshData();
          }}
          onCancel={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}
