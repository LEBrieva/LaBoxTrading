"use client";

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

interface MonthlyBarChartProps {
  data: { month: string; pnl: number; trades: number; wins: number; losses: number }[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { pnl: number; trades: number; wins: number; losses: number } }[]; label?: string }) {
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

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <div className="s"><ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252833" vertical={false} />
        <XAxis
          dataKey="month"
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
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.pnl >= 0 ? "#4ade80" : "#f87171"}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}
