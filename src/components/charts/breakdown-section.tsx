"use client";

import { useState, useMemo } from "react";
import { formatPnl } from "@/lib/calculations";
import type { BreakdownTrade } from "@/lib/actions/stats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type TimeRange = "7d" | "30d" | "all";
type Tab = "byPair" | "byStrategy" | "cross";
type CrossMode = "byPair" | "byStrategy";

interface BreakdownGroup {
  name: string;
  trades: number;
  wins: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

function filterByRange(data: BreakdownTrade[], range: TimeRange): BreakdownTrade[] {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return data.filter((d) => d.closedAt >= cutoff);
}

function aggregate(trades: BreakdownTrade[], key: "pair" | "strategy"): BreakdownGroup[] {
  const map = new Map<string, { trades: number; wins: number; totalPnl: number }>();
  for (const t of trades) {
    const name = t[key];
    const entry = map.get(name) ?? { trades: 0, wins: 0, totalPnl: 0 };
    entry.trades++;
    if (t.pnl > 0) entry.wins++;
    entry.totalPnl += t.pnl;
    map.set(name, entry);
  }
  return Array.from(map.entries())
    .map(([name, d]) => ({
      name,
      trades: d.trades,
      wins: d.wins,
      totalPnl: Math.round(d.totalPnl * 100) / 100,
      avgPnl: Math.round((d.totalPnl / d.trades) * 100) / 100,
      winRate: Math.round((d.wins / d.trades) * 100),
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

function RangeToggle({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const options: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "all", label: "Todo" },
  ];
  return (
    <div className="flex gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
            value === opt.value
              ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
              : "text-[#52525b] border border-transparent hover:text-[#71717a]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BreakdownTooltip({ active, payload }: { active?: boolean; payload?: { payload: BreakdownGroup }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] font-mono font-bold text-[#d4d4d8] mb-1">{d.name}</p>
      <p className="text-[13px] font-mono font-bold" style={{ color: d.totalPnl >= 0 ? "#4ade80" : "#f87171" }}>
        {formatPnl(d.totalPnl)}
      </p>
      <p className="text-[10px] text-[#71717a] font-mono">
        {d.trades} trade{d.trades !== 1 ? "s" : ""} — WR {d.winRate}% — Avg {formatPnl(d.avgPnl)}
      </p>
    </div>
  );
}

function BreakdownChart({ data }: { data: BreakdownGroup[] }) {
  if (data.length === 0) return <EmptyState />;
  const chartHeight = Math.max(200, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252833" horizontal={false} />
        <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} fontFamily="var(--font-mono)" />
        <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} width={100} fontFamily="var(--font-mono)" />
        <Tooltip content={<BreakdownTooltip />} cursor={{ fill: "rgba(94,234,212,0.05)" }} />
        <Bar dataKey="totalPnl" maxBarSize={28} radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.totalPnl >= 0 ? "#4ade80" : "#f87171"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BreakdownTable({ data }: { data: BreakdownGroup[] }) {
  if (data.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-[#252833]">
            <th className="pb-3 text-left text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Nombre</th>
            <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Trades</th>
            <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">WR%</th>
            <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">P&L</th>
            <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Avg P&L</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name} className="border-b border-[#1a1d27] hover:bg-[#14161e] transition-colors">
              <td className="py-3 font-mono text-[#d4d4d8]">{row.name}</td>
              <td className="py-3 text-right font-mono text-[#d4d4d8]">{row.trades}</td>
              <td className="py-3 text-right font-mono text-[#5eead4]">{row.winRate}%</td>
              <td className={`py-3 text-right font-mono font-bold ${row.totalPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                {formatPnl(row.totalPnl)}
              </td>
              <td className={`py-3 text-right font-mono ${row.avgPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                {formatPnl(row.avgPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <span className="text-2xl text-[#252833]">◈</span>
      <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">Sin datos en este período</p>
    </div>
  );
}

export function BreakdownSection({ trades }: { trades: BreakdownTrade[] }) {
  const [tab, setTab] = useState<Tab>("byPair");
  const [range, setRange] = useState<TimeRange>("all");
  const [crossMode, setCrossMode] = useState<CrossMode>("byPair");
  const [crossFilter, setCrossFilter] = useState<string>("");

  const filtered = useMemo(() => filterByRange(trades, range), [trades, range]);

  const byPair = useMemo(() => aggregate(filtered, "pair"), [filtered]);
  const byStrategy = useMemo(() => aggregate(filtered, "strategy"), [filtered]);

  const crossOptions = useMemo(() => {
    if (crossMode === "byPair") return [...new Set(filtered.map((t) => t.pair))].sort();
    return [...new Set(filtered.map((t) => t.strategy))].sort();
  }, [filtered, crossMode]);

  const crossData = useMemo(() => {
    if (!crossFilter) return [];
    const subset = crossMode === "byPair"
      ? filtered.filter((t) => t.pair === crossFilter)
      : filtered.filter((t) => t.strategy === crossFilter);
    const groupKey = crossMode === "byPair" ? "strategy" : "pair";
    return aggregate(subset, groupKey);
  }, [filtered, crossMode, crossFilter]);

  const tabs: { value: Tab; label: string }[] = [
    { value: "byPair", label: "Por Par" },
    { value: "byStrategy", label: "Por Estrategia" },
    { value: "cross", label: "Cruce" },
  ];

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            Breakdown
          </h2>
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <div className="flex gap-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
                tab === t.value
                  ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                  : "text-[#52525b] border border-transparent hover:text-[#71717a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-5">
        {tab === "byPair" && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1fr]">
            <BreakdownChart data={byPair} />
            <BreakdownTable data={byPair} />
          </div>
        )}

        {tab === "byStrategy" && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1fr]">
            <BreakdownChart data={byStrategy} />
            <BreakdownTable data={byStrategy} />
          </div>
        )}

        {tab === "cross" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-0.5">
                <button
                  onClick={() => { setCrossMode("byPair"); setCrossFilter(""); }}
                  className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
                    crossMode === "byPair"
                      ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30"
                      : "text-[#52525b] border border-transparent hover:text-[#71717a]"
                  }`}
                >
                  Filtrar por Par
                </button>
                <button
                  onClick={() => { setCrossMode("byStrategy"); setCrossFilter(""); }}
                  className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-[1.5px] font-semibold transition-colors cursor-pointer ${
                    crossMode === "byStrategy"
                      ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30"
                      : "text-[#52525b] border border-transparent hover:text-[#71717a]"
                  }`}
                >
                  Filtrar por Estrategia
                </button>
              </div>
              <select
                value={crossFilter}
                onChange={(e) => setCrossFilter(e.target.value)}
                className="bg-[#14161e] border border-[#252833] rounded px-3 py-1.5 text-[11px] font-mono text-[#d4d4d8] focus:outline-none focus:border-[#5eead4]/50"
              >
                <option value="">Seleccionar {crossMode === "byPair" ? "par" : "estrategia"}...</option>
                {crossOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {crossFilter ? (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1fr]">
                <BreakdownChart data={crossData} />
                <BreakdownTable data={crossData} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-2xl text-[#252833]">◈</span>
                <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                  Seleccioná un {crossMode === "byPair" ? "par" : "estrategia"} para ver el cruce
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
