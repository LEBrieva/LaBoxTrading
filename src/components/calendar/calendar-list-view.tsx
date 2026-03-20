"use client";

import { useRouter } from "next/navigation";

interface CalendarListViewProps {
  data: Record<string, { trades: number; pnl: number }>;
  year: number;
  month: number;
}

const WEEKDAY_ABBR = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function CalendarListView({ data, year, month }: CalendarListViewProps) {
  const router = useRouter();

  // Collect days that have trades, sorted reverse-chronologically
  const daysWithTrades = Object.entries(data)
    .filter(([, dayData]) => dayData.trades > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayData]) => {
      const date = new Date(dateKey + "T12:00:00");
      const dayNum = date.getDate();
      const weekday = WEEKDAY_ABBR[date.getDay()];
      return { dateKey, dayNum, weekday, ...dayData };
    });

  if (daysWithTrades.length === 0) {
    return (
      <div className="block md:hidden">
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="text-2xl text-[#252833]">&#9671;</span>
          <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono">
            Sin trades este mes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="block md:hidden space-y-2">
      {daysWithTrades.map(({ dateKey, dayNum, weekday, trades, pnl }) => (
        <button
          key={dateKey}
          onClick={() => router.push(`/trades?from=${dateKey}&to=${dateKey}`)}
          className="w-full flex items-center justify-between bg-[#1a1d27] border border-[#252833] rounded-lg px-4 py-3 hover:border-[#5eead4]/40 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#d4d4d8] min-w-[3rem]">
              {weekday} {dayNum}
            </span>
            <span className="font-mono text-[11px] text-[#71717a]">
              {trades} {trades === 1 ? "trade" : "trades"}
            </span>
          </div>
          <span
            className={`font-mono text-sm font-bold s ${
              pnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
            }`}
          >
            {formatPnl(pnl)}
          </span>
        </button>
      ))}
    </div>
  );
}
