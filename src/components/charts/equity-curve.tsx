"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface EquityCurveProps {
  data: { date: string; capital: number; pnl: number }[];
  initialCapital: number;
}

export function EquityCurve({ data, initialCapital }: EquityCurveProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={formatted} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="dateLabel"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Capital"]}
        />
        <ReferenceLine
          y={initialCapital}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="5 5"
          label={{
            value: `Inicio: $${initialCapital}`,
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="capital"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
