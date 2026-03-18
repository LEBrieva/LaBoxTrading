"use client";

import { usePrices } from "@/contexts/price-context";

const statusConfig = {
  connected: { color: "#4ade80", label: "Live" },
  connecting: { color: "#fbbf24", label: "Conectando" },
  reconnecting: { color: "#fbbf24", label: "Reconectando" },
  disconnected: { color: "#71717a", label: "Offline" },
} as const;

export function ConnectionStatus() {
  const { status } = usePrices();

  if (status === "disconnected") return null;

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#252833] bg-[#0e1015]">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: config.color,
          boxShadow: status === "connected" ? `0 0 6px ${config.color}` : undefined,
        }}
      />
      <span className="text-[9px] uppercase tracking-[1.5px] font-mono" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
