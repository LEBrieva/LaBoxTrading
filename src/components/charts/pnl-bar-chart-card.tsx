"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PeriodData {
  period: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

type ViewMode = "monthly" | "weekly";

function formatLabel(period: string, mode: ViewMode): string {
  if (mode === "monthly") {
    // "2026-03" → "Mar 26"
    const [y, m] = period.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
  }
  // "2026-03-10" → "10/03"
  const [, m, d] = period.split("-");
  return `${d}/${m}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: PeriodData & { label: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { pnl, trades, wins, losses } = payload[0].payload;
  const sign = pnl >= 0 ? "+" : "";
  const wr = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : "—";

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#71717a] font-mono mb-1">{label}</p>
      <p
        className="text-[13px] font-mono font-bold"
        style={{ color: pnl >= 0 ? "#4ade80" : "#f87171" }}
      >
        {sign}${Math.abs(pnl).toFixed(2)}
      </p>
      <p className="text-[10px] text-[#71717a] font-mono">
        {trades} trades — {wins}W/{losses}L — {wr}%
      </p>
    </div>
  );
}

export function PnlBarChartCard({
  monthlyData,
  weeklyData,
}: {
  monthlyData: PeriodData[];
  weeklyData: PeriodData[];
}) {
  const [mode, setMode] = useState<ViewMode>("monthly");
  const data = mode === "monthly" ? monthlyData : weeklyData;

  const formatted = data.map((d) => ({
    ...d,
    label: formatLabel(d.period, mode),
  }));

  const isEmpty = formatted.length === 0;

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
        <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
          P&L {mode === "monthly" ? "Mensual" : "Semanal"}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("weekly")}
            className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
              mode === "weekly"
                ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                : "text-[#52525b] border border-transparent hover:text-[#71717a]"
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
              mode === "monthly"
                ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                : "text-[#52525b] border border-transparent hover:text-[#71717a]"
            }`}
          >
            Mensual
          </button>
        </div>
      </div>
      <div className="p-3 md:p-4 s">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-2xl text-[#252833]">◈</span>
            <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
              Sin datos aún
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatted} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252833" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#252833" }}
                fontFamily="var(--font-mono)"
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                fontFamily="var(--font-mono)"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(94,234,212,0.05)" }} />
              <ReferenceLine y={0} stroke="#52525b" strokeWidth={1} />
              <Bar dataKey="pnl" maxBarSize={40}>
                {formatted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#4ade80" : "#f87171"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
