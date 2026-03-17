import { cookies } from "next/headers";
import Link from "next/link";
import { getAccounts } from "@/lib/actions/accounts";
import { getTrades } from "@/lib/actions/trades";
import { getAccountStats } from "@/lib/actions/stats";
import { formatPnl, formatCurrency, formatPct, calcProgressPct } from "@/lib/calculations";
import { TradeForm } from "@/components/trades/trade-form";
import { TradeCard } from "@/components/trades/trade-card";

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
  const [stats, openTrades] = await Promise.all([
    getAccountStats(account.id),
    getTrades(account.id, { status: "OPEN" }),
  ]);

  const progress = calcProgressPct(
    stats.currentCapital,
    stats.initialCapital,
    stats.targetCapital
  );

  const pnlIsPositive = stats.totalPnl >= 0;
  const pnlPrefix = pnlIsPositive ? "+$" : "-$";
  const pnlValue = Math.abs(stats.totalPnl).toFixed(2);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#08090c]">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-5 border-b border-[#252833] bg-[#0e1015]">
        {/* P&L Total */}
        <div className="px-6 py-4 border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            P&L Total
          </p>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: pnlIsPositive ? "#4ade80" : "#f87171" }}
          >
            {pnlPrefix}{pnlValue}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {formatPct(stats.totalPnlPct)}
          </p>
        </div>

        {/* Win Rate */}
        <div className="px-6 py-4 border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Win Rate
          </p>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: "#5eead4" }}
          >
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {stats.wins}W / {stats.losses}L de {stats.totalTrades}
          </p>
        </div>

        {/* Trades Cerrados */}
        <div className="px-6 py-4 border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Trades Cerrados
          </p>
          <p className="font-mono text-xl font-bold text-[#d4d4d8]">
            {stats.totalTrades}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            racha {stats.currentStreak > 0 ? "+" : ""}{stats.currentStreak}
          </p>
        </div>

        {/* Mayor Ganancia */}
        <div className="px-6 py-4 border-r border-[#252833]">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Mayor Ganancia
          </p>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: "#4ade80" }}
          >
            +${stats.bestTrade.toFixed(2)}
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            peor {formatPnl(stats.worstTrade)}
          </p>
        </div>

        {/* Objetivo */}
        <div className="px-6 py-4">
          <p className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1.5 font-medium">
            Objetivo
          </p>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: "#fbbf24" }}
          >
            {progress.toFixed(1)}%
          </p>
          <p className="font-mono text-[10px] text-[#71717a] mt-0.5">
            {formatCurrency(stats.targetCapital)}
          </p>
        </div>
      </div>

      {/* ── Section Header: Trades Abiertos ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#252833] bg-[#0e1015]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[3px] text-[#71717a] font-bold">
            Trades Abiertos
          </span>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-[#252833] bg-[#14161e] text-[#5eead4]">
            {openTrades.length}
          </span>
        </div>
        <TradeForm accountId={account.id} currentCapital={stats.currentCapital} />
      </div>

      {/* ── Trade Cards ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#08090c]">
        {openTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl text-[#252833]">◈</span>
            <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
              Sin trades abiertos
            </p>
          </div>
        ) : (
          openTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              id={trade.id}
              pair={trade.pair}
              direction={trade.direction}
              riskUsd={trade.riskUsd}
              riskPct={trade.riskPct}
              entry={trade.entry}
              stopLoss={trade.stopLoss}
              size={trade.size}
              externalId={trade.externalId}
              notes={trade.notes}
              imageUrl={trade.imageUrl}
              openedAt={trade.openedAt}
              closedAt={trade.closedAt}
              status={trade.status}
              positions={trade.positions}
            />
          ))
        )}
      </div>
    </div>
  );
}
