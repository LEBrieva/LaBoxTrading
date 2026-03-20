"use client";

import type { TimelineEntry } from "@/lib/actions/stats";
import { formatCurrency } from "@/lib/calculations";

const typeBadge: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DEPOSIT: { label: "Depósito", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)" },
  WITHDRAWAL: { label: "Retiro", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
  TRADE: { label: "Trade", color: "#5eead4", bg: "rgba(94,234,212,0.1)", border: "rgba(94,234,212,0.25)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MovementRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: TimelineEntry;
  onEdit?: (entry: TimelineEntry) => void;
  onDelete?: (id: string) => void;
}) {
  const badge = typeBadge[entry.type];
  const isPositive = entry.amount >= 0;
  const isTx = entry.type !== "TRADE";

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0e1015] border border-[#252833] rounded-lg hover:border-[#2f3340] transition-colors group">
      {/* Date */}
      <span className="font-mono text-[11px] text-[#71717a] min-w-[70px] shrink-0">
        {formatDate(entry.date)}
      </span>

      {/* Type badge */}
      <span
        className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-[2px] rounded border shrink-0"
        style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.border }}
      >
        {badge.label}
      </span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <span className="font-mono text-sm text-[#d4d4d8] truncate block">
          {entry.label}
        </span>
        {entry.note && (
          <span className="text-[10px] text-[#52525b] italic truncate block">
            {entry.note}
          </span>
        )}
      </div>

      {/* Actions (only for transactions, not trades) — before amounts */}
      {isTx && (onEdit || onDelete) ? (
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="px-2 py-1 rounded text-[11px] text-[#71717a] hover:text-[#5eead4] hover:bg-[#5eead4]/10 font-mono transition-colors cursor-pointer"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="px-2 py-1 rounded text-[11px] text-[#71717a] hover:text-[#f87171] hover:bg-[#f87171]/10 font-mono transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          )}
        </div>
      ) : (
        <div className="min-w-[130px] shrink-0" />
      )}

      {/* Amount */}
      <span
        className={`font-mono text-sm font-bold shrink-0 s ${
          isPositive ? "text-[#4ade80]" : "text-[#f87171]"
        }`}
      >
        {isPositive ? "+" : ""}{formatCurrency(Math.abs(entry.amount))}
      </span>

      {/* Balance */}
      <span className="font-mono text-[11px] text-[#71717a] min-w-[80px] text-right shrink-0 s">
        {formatCurrency(entry.balance)}
      </span>
    </div>
  );
}
