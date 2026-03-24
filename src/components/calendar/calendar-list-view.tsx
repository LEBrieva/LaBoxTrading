"use client";

import type { UnifiedCalendarDay } from "@/lib/actions/stats";

interface CalendarListViewProps {
  data: Record<string, UnifiedCalendarDay>;
  year: number;
  month: number;
  onDayClick: (dateKey: string) => void;
}

const WEEKDAY_ABBR = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const MOOD_COLORS: Record<string, string> = {
  GREAT: "#4ade80",
  GOOD: "#5eead4",
  NEUTRAL: "#71717a",
  BAD: "#fb923c",
  TERRIBLE: "#f87171",
};

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function CalendarListView({ data, year, month, onDayClick }: CalendarListViewProps) {
  const daysWithActivity = Object.entries(data)
    .filter(([, d]) => d.trades > 0 || d.mood)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, dayData]) => {
      const date = new Date(dateKey + "T12:00:00");
      const dayNum = date.getDate();
      const weekday = WEEKDAY_ABBR[date.getDay()];
      return { dateKey, dayNum, weekday, ...dayData };
    });

  if (daysWithActivity.length === 0) {
    return (
      <div className="block md:hidden">
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="text-2xl text-[#252833]">&#9671;</span>
          <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase font-mono">
            Sin actividad este mes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="block md:hidden space-y-2">
      {daysWithActivity.map(({ dateKey, dayNum, weekday, trades, pnl, mood }) => (
        <button
          key={dateKey}
          onClick={() => onDayClick(dateKey)}
          className="w-full flex items-center justify-between bg-[#1a1d27] border border-[#252833] rounded-lg px-4 py-3 hover:border-[#5eead4]/40 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#d4d4d8] min-w-[3rem]">
              {weekday} {dayNum}
            </span>
            {trades > 0 && (
              <span className="font-mono text-[11px] text-[#71717a]">
                {trades} {trades === 1 ? "trade" : "trades"}
              </span>
            )}
            {mood && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: MOOD_COLORS[mood] }}
              />
            )}
          </div>
          {trades > 0 ? (
            <span
              className={`font-mono text-sm font-bold ${
                pnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
              }`}
            >
              {formatPnl(pnl)}
            </span>
          ) : (
            <span className="text-[10px] text-[#52525b] font-mono">Nota</span>
          )}
        </button>
      ))}
    </div>
  );
}
