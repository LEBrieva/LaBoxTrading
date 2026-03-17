import { cookies } from "next/headers";
import Link from "next/link";
import { getAccounts } from "@/lib/actions/accounts";
import {
  getAccountStats,
  getEquityData,
  getWeeklyMonthlyStats,
} from "@/lib/actions/stats";
import {
  formatPnl,
  formatCurrency,
  formatPct,
  calcProgressPct,
} from "@/lib/calculations";
import { EquityCurve } from "@/components/charts/equity-curve";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";

export default async function DashboardPage() {
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId =
    cookieStore.get("activeAccountId")?.value || accounts[0]?.id;

  if (!activeAccountId || accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 bg-[#08090c]">
        <span className="text-[#252833] text-2xl">◈</span>
        <p className="text-[13px] text-[#52525b] tracking-[2px] uppercase">
          Configurá tu primera cuenta para empezar
        </p>
        <Link
          href="/accounts"
          className="text-[11px] uppercase tracking-[3px] font-semibold text-[#5eead4] hover:brightness-110 transition-all"
        >
          [ Ir a Cuentas ]
        </Link>
      </div>
    );
  }

  const account =
    accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const [stats, equityData, monthlyData] = await Promise.all([
    getAccountStats(account.id),
    getEquityData(account.id),
    getWeeklyMonthlyStats(account.id),
  ]);

  const progress = calcProgressPct(
    stats.currentCapital,
    stats.initialCapital,
    stats.targetCapital
  );

  const pnlIsPositive = stats.totalPnl >= 0;
  const pnlPrefix = pnlIsPositive ? "+$" : "-$";
  const pnlValue = Math.abs(stats.totalPnl).toFixed(2);

  const monthlyArray = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#08090c]">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#252833] bg-[#0e1015]">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            P&L Total
          </p>
          <p
            className="font-mono text-base md:text-xl font-bold"
            style={{ color: pnlIsPositive ? "#4ade80" : "#f87171" }}
          >
            {pnlPrefix}{pnlValue}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {formatPct(stats.totalPnlPct)}
          </p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Win Rate
          </p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#5eead4" }}>
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {stats.wins}W / {stats.losses}L de {stats.totalTrades}
          </p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Trades Cerrados
          </p>
          <p className="font-mono text-base md:text-xl font-bold text-[#d4d4d8]">
            {stats.totalTrades}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            racha {stats.currentStreak > 0 ? "+" : ""}{stats.currentStreak}
          </p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Mayor Ganancia
          </p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#4ade80" }}>
            +${stats.bestTrade.toFixed(2)}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            peor {formatPnl(stats.worstTrade)}
          </p>
        </div>

        <div className="col-span-2 md:col-span-1 px-4 py-3 md:px-6 md:py-4">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Objetivo
          </p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#fbbf24" }}>
            {progress.toFixed(1)}%
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {formatCurrency(stats.targetCapital)}
          </p>
        </div>
      </div>

      {/* ── Charts & Stats ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#08090c]">
        {/* Charts Row */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Equity Curve */}
          <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
            <div className="px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
              <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
                Equity Curve
              </h2>
            </div>
            <div className="p-3 md:p-4">
              {equityData.length <= 1 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-2xl text-[#252833]">◈</span>
                  <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                    Necesitás al menos un trade cerrado
                  </p>
                </div>
              ) : (
                <EquityCurve
                  data={equityData}
                  initialCapital={stats.initialCapital}
                />
              )}
            </div>
          </div>

          {/* Monthly P&L */}
          <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
            <div className="px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
              <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
                P&L Mensual
              </h2>
            </div>
            <div className="p-3 md:p-4">
              {monthlyArray.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-2xl text-[#252833]">◈</span>
                  <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                    Sin datos mensuales aún
                  </p>
                </div>
              ) : (
                <MonthlyBarChart data={monthlyArray} />
              )}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
          <div className="px-4 py-2 md:px-5 md:py-3 border-b border-[#252833]">
            <h2 className="text-[10px] uppercase tracking-[2px] text-[#71717a] font-semibold">
              Resumen Mensual
            </h2>
          </div>
          <div className="p-3 md:p-5">
            {monthlyArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-2xl text-[#252833]">◈</span>
                <p className="text-[11px] text-[#52525b] tracking-[2px] uppercase">
                  Sin datos
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-[#252833]">
                      <th className="pb-3 text-left text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Mes
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Trades
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Wins
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Losses
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Win %
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        P&L
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Mejor
                      </th>
                      <th className="pb-3 text-right text-[10px] uppercase tracking-[2px] text-[#52525b] font-semibold">
                        Peor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyArray.map((row) => {
                      const total = row.wins + row.losses;
                      const wr = total > 0 ? ((row.wins / total) * 100).toFixed(0) : "—";
                      return (
                        <tr
                          key={row.month}
                          className="border-b border-[#1a1d27] hover:bg-[#14161e] transition-colors"
                        >
                          <td className="py-3 font-mono text-[#d4d4d8]">
                            {row.month}
                          </td>
                          <td className="py-3 text-right font-mono text-[#d4d4d8]">
                            {row.trades}
                          </td>
                          <td className="py-3 text-right font-mono text-[#4ade80]">
                            {row.wins}
                          </td>
                          <td className="py-3 text-right font-mono text-[#f87171]">
                            {row.losses}
                          </td>
                          <td className="py-3 text-right font-mono text-[#5eead4]">
                            {wr}%
                          </td>
                          <td
                            className={`py-3 text-right font-mono font-bold ${
                              row.pnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                            }`}
                          >
                            {formatPnl(row.pnl)}
                          </td>
                          <td className="py-3 text-right font-mono text-[#4ade80]">
                            {formatPnl(row.best)}
                          </td>
                          <td className="py-3 text-right font-mono text-[#f87171]">
                            {formatPnl(row.worst)}
                          </td>
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
    </div>
  );
}
