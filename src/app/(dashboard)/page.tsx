import { cookies } from "next/headers";
import Link from "next/link";
import { getAccounts } from "@/lib/actions/accounts";
import { getEquityData, getDailyStats } from "@/lib/actions/stats";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { DashboardStatsBar } from "@/components/dashboard/dashboard-stats-bar";

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
  const [equityData, dailyData] = await Promise.all([
    getEquityData(account.id),
    getDailyStats(account.id),
  ]);

  const dailyArray = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#08090c]">
      <DashboardStatsBar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#08090c]">
        <DashboardCharts
          equityData={equityData}
          initialCapital={account.initialCapital}
          dailyData={dailyArray}
        />
      </div>
    </div>
  );
}
