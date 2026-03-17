"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCalendarData } from "@/lib/actions/stats";
import { CalendarListView } from "@/components/calendar/calendar-list-view";

interface CalendarViewProps {
  initialData: Record<string, { trades: number; pnl: number }>;
  accountId: string;
  initialYear: number;
  initialMonth: number;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function CalendarView({
  initialData,
  accountId,
  initialYear,
  initialMonth,
}: CalendarViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(
    async (y: number, m: number) => {
      setLoading(true);
      try {
        const result = await getCalendarData(accountId, y, m);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [accountId]
  );

  function prevMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    fetchData(newYear, newMonth);
  }

  function nextMonth() {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;

    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    fetchData(newYear, newMonth);
  }

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  // Monthly summary
  const monthEntries = Object.values(data);
  const monthTrades = monthEntries.reduce((s, d) => s + d.trades, 0);
  const monthPnl = monthEntries.reduce((s, d) => s + d.pnl, 0);
  const winDays = monthEntries.filter((d) => d.pnl > 0).length;
  const lossDays = monthEntries.filter((d) => d.pnl < 0).length;

  return (
    <div>
      {/* Header: nav + summary */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="px-3 py-2 rounded text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#14161e] transition-colors text-sm cursor-pointer"
        >
          ← Anterior
        </button>

        <div className="text-center">
          <h2 className="text-lg md:text-2xl font-bold text-[#d4d4d8] tracking-wide">
            {MONTHS[month]} {year}
          </h2>
          {monthTrades > 0 && (
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="font-mono text-[11px] text-[#71717a]">
                {monthTrades} trades
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  monthPnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                }`}
              >
                {formatPnl(monthPnl)}
              </span>
              <span className="font-mono text-[11px] text-[#71717a]">
                {winDays}
                <span className="text-[#4ade80]">▲</span>
                {" "}{lossDays}
                <span className="text-[#f87171]">▼</span>
              </span>
            </div>
          )}
        </div>

        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className={`px-3 py-2 rounded text-sm transition-colors ${
            isCurrentMonth
              ? "text-[#252833] cursor-not-allowed"
              : "text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#14161e] cursor-pointer"
          }`}
        >
          Siguiente →
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-2 mb-2">
          <span className="text-[10px] text-[#5eead4] uppercase tracking-[2px] font-mono animate-pulse">
            Cargando...
          </span>
        </div>
      )}

      {/* Weekday headers */}
      <div className="hidden md:grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold py-2"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          if (day === null) return <div key={`pad-${idx}`} />;

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayData = data[dateKey];
          const isTodayCell = isToday(day);
          const hasTrades = !!dayData;
          const isWeekend = (() => {
            const d = new Date(year, month, day);
            return d.getDay() === 0 || d.getDay() === 6;
          })();

          return (
            <div
              key={dateKey}
              onClick={hasTrades ? () => router.push(`/trades?from=${dateKey}&to=${dateKey}`) : undefined}
              className={`relative min-h-[90px] rounded-lg border p-3 transition-colors ${
                hasTrades
                  ? "bg-[#0e1015] border-[#252833] cursor-pointer hover:border-[#5eead4]/40"
                  : isWeekend
                    ? "bg-[#08090c] border-[#14161e]"
                    : "bg-[#0a0c10] border-[#1a1d27]"
              } ${isTodayCell ? "ring-1 ring-[#5eead4]/40" : ""}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    isTodayCell
                      ? "text-[#5eead4]"
                      : hasTrades
                        ? "text-[#d4d4d8]"
                        : "text-[#52525b]"
                  }`}
                >
                  {day}
                </span>
                {isTodayCell && (
                  <span className="text-[8px] uppercase tracking-[1px] text-[#5eead4] font-mono">
                    Hoy
                  </span>
                )}
              </div>

              {/* Trade data */}
              {hasTrades && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#71717a] font-mono">
                      {dayData.trades} {dayData.trades === 1 ? "trade" : "trades"}
                    </span>
                  </div>
                  <div
                    className={`font-mono text-[13px] font-bold ${
                      dayData.pnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                    }`}
                  >
                    {formatPnl(dayData.pnl)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile list view */}
      <CalendarListView data={data} year={year} month={month} />
    </div>
  );
}
