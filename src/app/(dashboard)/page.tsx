import { cookies } from "next/headers";
import Link from "next/link";
import { getAccounts } from "@/lib/actions/accounts";
import {
  getAccountStats,
  getEquityData,
  getDailyStats,
} from "@/lib/actions/stats";
import {
  formatPnl,
  formatCurrency,
  formatPct,
  calcProgressPct,
} from "@/lib/calculations";
import { DashboardCharts } from "@/components/charts/dashboard-charts";

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
  const [stats, equityData, dailyData] = await Promise.all([
    getAccountStats(account.id),
    getEquityData(account.id),
    getDailyStats(account.id),
  ]);

  const progress = calcProgressPct(
    stats.currentCapital,
    stats.initialCapital,
    stats.targetCapital
  );

  const pnlIsPositive = stats.totalPnl >= 0;
  const pnlPrefix = pnlIsPositive ? "+$" : "-$";
  const pnlValue = Math.abs(stats.totalPnl).toFixed(2);

  const dailyArray = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#08090c]">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#252833] bg-[#0e1015]">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">P&L Total</p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: pnlIsPositive ? "#4ade80" : "#f87171" }}>
            {pnlPrefix}{pnlValue}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">{formatPct(stats.totalPnlPct)}</p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Win Rate</p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#5eead4" }}>{stats.winRate.toFixed(1)}%</p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">{stats.wins}W / {stats.losses}L de {stats.totalTrades}</p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Trades Cerrados</p>
          <p className="font-mono text-base md:text-xl font-bold text-[#d4d4d8]">{stats.totalTrades}</p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            racha {stats.currentStreak > 0 ? "+" : ""}{stats.currentStreak}
          </p>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Mayor Ganancia</p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#4ade80" }}>+${stats.bestTrade.toFixed(2)}</p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">peor {formatPnl(stats.worstTrade)}</p>
        </div>

        <div className="col-span-2 md:col-span-1 px-4 py-3 md:px-6 md:py-4">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">Objetivo</p>
          <p className="font-mono text-base md:text-xl font-bold" style={{ color: "#fbbf24" }}>{progress.toFixed(1)}%</p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">{formatCurrency(stats.targetCapital)}</p>
        </div>
      </div>

      {/* Charts & Tables */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#08090c]">
        <DashboardCharts
          equityData={equityData}
          initialCapital={stats.initialCapital}
          dailyData={dailyArray}
        />
      </div>
    </div>
  );
}
