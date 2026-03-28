"use client";

import { useState, useMemo } from "react";
import { EquityCurve } from "./equity-curve";
import { BreakdownSection } from "./breakdown-section";
import { formatPnl } from "@/lib/calculations";
import type { BreakdownTrade } from "@/lib/actions/stats";
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

type TimeRange = "7d" | "30d" | "all";

interface DailyData {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  best: number;
  worst: number;
}

interface EquityPoint {
  date: string;
  capital: number;
  pnl: number;
  trades?: number;
  deposit?: number;
  withdrawal?: number;
}

interface DashboardChartsProps {
  equityData: EquityPoint[];
  initialCapital: number;
  dailyData: DailyData[];
  breakdownTrades: BreakdownTrade[];
}

function filterByRange<T extends { date: string }>(data: T[], range: TimeRange): T[] {
  if (range === "all") return data;
  const now = new Date();
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return data.filter((d) => d.date >= cutoff);
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

function PnlTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: DailyData & { label: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { pnl, trades, wins, losses } = payload[0].payload;
  const sign = pnl >= 0 ? "+" : "";
  const wr = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : "—";

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#71717a] font-mono mb-1">{label}</p>
      <p className="text-[13px] font-mono font-bold" style={{ color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
        {sign}${Math.abs(pnl).toFixed(2)}
      </p>
      <p className="text-[10px] text-[#71717a] font-mono">
        {trades} trade{trades !== 1 ? "s" : ""} — {wins}W/{losses}L — {wr}%
      </p>
    </div>
  );
}

function formatDateLabel(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

export function DashboardCharts({ equityData, initialCapital, dailyData, breakdownTrades }: DashboardChartsProps) {
  const [equityRange, setEquityRange] = useState<TimeRange>("30d");
  const [pnlRange, setPnlRange] = useState<TimeRange>("30d");
  const [tableRange, setTableRange] = useState<TimeRange>("30d");

  const filteredEquity = useMemo(() => {
    const filtered = filterByRange(equityData, equityRange);
    // Always include at least the first point for context
    if (filtered.length > 0 && filtered[0] !== equityData[0]) {
      // Find the last point before the cutoff to use as starting capital
      const cutoffDate = filtered[0].date;
      const beforeCutoff = equityData.filter((d) => d.date < cutoffDate);
      if (beforeCutoff.length > 0) {
        const startPoint = { ...beforeCutoff[beforeCutoff.length - 1], pnl: 0, trades: 0 };
        return [startPoint, ...filtered];
      }
    }
    return filtered;
  }, [equityData, equityRange]);

  const filteredPnl = useMemo(() => {
    return filterByRange(dailyData, pnlRange).map((d) => ({
      ...d,
      label: formatDateLabel(d.date),
    }));
  }, [dailyData, pnlRange]);

  const filteredTable = useMemo(() => {
    return filterByRange(dailyData, tableRange).map((d) => ({
      ...d,
      label: formatDateLabel(d.date),
    }));
  }, [dailyData, tableRange]);

  const rangeLabel = (range: TimeRange) =>
    range === "7d" ? "7 días" : range === "30d" ? "30 días" : "Todo";

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Equity Curve */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
            <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
              Equity Curve
            </h2>
            <RangeToggle value={equityRange} onChange={setEquityRange} />
          </div>
          <div className="p-3 md:p-4 s">
            {filteredEquity.length <= 1 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="text-2xl text-[#252833]">◈</span>
                <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                  Sin trades cerrados en este período
                </p>
              </div>
            ) : (
              <EquityCurve data={filteredEquity} initialCapital={initialCapital} />
            )}
          </div>
        </div>

        {/* P&L Bar Chart */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
            <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
              P&L Diario
            </h2>
            <RangeToggle value={pnlRange} onChange={setPnlRange} />
          </div>
          <div className="p-3 md:p-4 s">
            {filteredPnl.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="text-2xl text-[#252833]">◈</span>
                <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">Sin datos en este período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={filteredPnl} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252833" vertical={false} />
                  <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} axisLine={{ stroke: "#252833" }} fontFamily="var(--font-mono)" />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} fontFamily="var(--font-mono)" width={60} />
                  <Tooltip content={<PnlTooltip />} cursor={{ fill: "rgba(94,234,212,0.05)" }} />
                  <ReferenceLine y={0} stroke="#52525b" strokeWidth={1} />
                  <Bar dataKey="pnl" maxBarSize={40}>
                    {filteredPnl.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#4ade80" : "#f87171"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <BreakdownSection trades={breakdownTrades} />

      {/* Resumen Diario */}
      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
          <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            Resumen Diario
          </h2>
          <RangeToggle value={tableRange} onChange={setTableRange} />
        </div>
        <div className="p-3 md:p-5">
          {filteredTable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-2xl text-[#252833]">◈</span>
              <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">Sin datos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-[#252833]">
                    <th className="pb-3 text-left text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Día</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Trades</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Wins</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Losses</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Win %</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">P&L</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Mejor</th>
                    <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">Peor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTable.map((row) => {
                    const total = row.wins + row.losses;
                    const wr = total > 0 ? ((row.wins / total) * 100).toFixed(0) : "—";
                    return (
                      <tr key={row.date} className="border-b border-[#1a1d27] hover:bg-[#14161e] transition-colors">
                        <td className="py-3 font-mono text-[#d4d4d8]">{row.label}</td>
                        <td className="py-3 text-right font-mono text-[#d4d4d8]">{row.trades}</td>
                        <td className="py-3 text-right font-mono text-[#4ade80]">{row.wins}</td>
                        <td className="py-3 text-right font-mono text-[#f87171]">{row.losses}</td>
                        <td className="py-3 text-right font-mono text-[#5eead4]">{wr}%</td>
                        <td className={`py-3 text-right font-mono font-bold s ${row.pnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                          {formatPnl(row.pnl)}
                        </td>
                        <td className="py-3 text-right font-mono text-[#4ade80] s">{formatPnl(row.best)}</td>
                        <td className="py-3 text-right font-mono text-[#f87171] s">{formatPnl(row.worst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
