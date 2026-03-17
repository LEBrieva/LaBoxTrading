import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import {
  getEquityData,
  getWeeklyMonthlyStats,
  getAccountStats,
} from "@/lib/actions/stats";
import { formatPnl } from "@/lib/calculations";
import { EquityCurve } from "@/components/charts/equity-curve";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";

export default async function StatsPage() {
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId =
    cookieStore.get("activeAccountId")?.value || accounts[0]?.id;

  if (!activeAccountId) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            Seleccioná una cuenta primero
          </p>
        </div>
      </div>
    );
  }

  const [equityData, monthlyData, stats] = await Promise.all([
    getEquityData(activeAccountId),
    getWeeklyMonthlyStats(activeAccountId),
    getAccountStats(activeAccountId),
  ]);

  const monthlyArray = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
        Estadísticas
      </h1>

      {/* Equity Curve */}
      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252833]">
          <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            Equity Curve
          </h2>
        </div>
        <div className="p-6">
          {equityData.length <= 1 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-2xl text-[#252833]">◈</span>
              <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
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

      {/* Monthly P&L Chart */}
      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252833]">
          <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            P&L Mensual
          </h2>
        </div>
        <div className="p-6">
          {monthlyArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-2xl text-[#252833]">◈</span>
              <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
                Sin datos mensuales aún
              </p>
            </div>
          ) : (
            <MonthlyBarChart data={monthlyArray} />
          )}
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252833]">
          <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            Resumen Mensual
          </h2>
        </div>
        <div className="p-6">
          {monthlyArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-2xl text-[#252833]">◈</span>
              <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
                Sin datos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  {monthlyArray.map((row) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
