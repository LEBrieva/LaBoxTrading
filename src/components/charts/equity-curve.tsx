"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  capital: number;
  pnl: number;
  trades?: number;
  deposit?: number;
  withdrawal?: number;
}

interface EquityCurveProps {
  data: DataPoint[];
  initialCapital: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: DataPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { capital, pnl, trades, deposit, withdrawal } = payload[0].payload;
  const sign = pnl >= 0 ? "+" : "";

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#71717a] font-mono mb-1">{label}</p>
      <p className="text-[13px] font-mono font-bold text-[#d4d4d8]">
        ${capital.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {pnl !== 0 && (
        <p
          className="text-[11px] font-mono font-semibold"
          style={{ color: pnl >= 0 ? "#4ade80" : "#f87171" }}
        >
          {sign}${Math.abs(pnl).toFixed(2)}
          {trades ? ` (${trades} trade${trades > 1 ? "s" : ""})` : ""}
        </p>
      )}
      {!!deposit && deposit > 0 && (
        <p className="text-[11px] font-mono font-semibold text-[#60a5fa]">
          +${deposit.toFixed(2)} deposito
        </p>
      )}
      {!!withdrawal && withdrawal > 0 && (
        <p className="text-[11px] font-mono font-semibold text-[#fbbf24]">
          -${withdrawal.toFixed(2)} retiro
        </p>
      )}
    </div>
  );
}

function CustomDot(props: { cx?: number; cy?: number; payload?: DataPoint; r?: number; fill?: string; strokeWidth?: number }) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;

  const hasDeposit = !!payload.deposit && payload.deposit > 0;
  const hasWithdrawal = !!payload.withdrawal && payload.withdrawal > 0;

  if (!hasDeposit && !hasWithdrawal) return null;

  // Triangle marker: up for deposit, down for withdrawal
  const size = 6;
  if (hasDeposit && hasWithdrawal) {
    // Both: diamond shape
    return (
      <g>
        <polygon
          points={`${cx},${cy - size - 4} ${cx + size},${cy - 4} ${cx},${cy + size - 4} ${cx - size},${cy - 4}`}
          fill="#60a5fa"
          stroke="#0e1015"
          strokeWidth={1}
        />
      </g>
    );
  }

  if (hasDeposit) {
    // Up triangle
    return (
      <polygon
        points={`${cx},${cy - size - 4} ${cx + size},${cy + size - 4} ${cx - size},${cy + size - 4}`}
        fill="#60a5fa"
        stroke="#0e1015"
        strokeWidth={1}
      />
    );
  }

  // Down triangle
  return (
    <polygon
      points={`${cx - size},${cy - size - 4} ${cx + size},${cy - size - 4} ${cx},${cy + size - 4}`}
      fill="#fbbf24"
      stroke="#0e1015"
      strokeWidth={1}
    />
  );
}

export function EquityCurve({ data, initialCapital }: EquityCurveProps) {
  const formatted = data.map((d) => {
    const parts = d.date.split("-");
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
    return { ...d, dateLabel: label };
  });

  const capitals = data.map((d) => d.capital);
  const minCapital = Math.min(...capitals);
  const maxCapital = Math.max(...capitals);
  const padding = (maxCapital - minCapital) * 0.1 || initialCapital * 0.05;
  const yMin = Math.floor(minCapital - padding);
  const yMax = Math.ceil(maxCapital + padding);

  const lastCapital = data[data.length - 1]?.capital ?? initialCapital;
  const isAbove = lastCapital >= initialCapital;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="equityGradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="equityGradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#252833" vertical={false} />
        <XAxis
          dataKey="dateLabel"
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
          domain={[yMin, yMax]}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          fontFamily="var(--font-mono)"
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={initialCapital}
          stroke="#52525b"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Area
          type="monotone"
          dataKey="capital"
          stroke={isAbove ? "#4ade80" : "#f87171"}
          strokeWidth={2}
          fill={isAbove ? "url(#equityGradientGreen)" : "url(#equityGradientRed)"}
          dot={data.length <= 30 ? { r: 3, fill: isAbove ? "#4ade80" : "#f87171", strokeWidth: 0 } : false}
          activeDot={{ r: 5, fill: isAbove ? "#4ade80" : "#f87171", strokeWidth: 0 }}
        />
        {/* Transaction markers layer */}
        <Area
          type="monotone"
          dataKey="capital"
          stroke="none"
          fill="none"
          dot={<CustomDot />}
          activeDot={false}
          legendType="none"
          tooltipType="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
