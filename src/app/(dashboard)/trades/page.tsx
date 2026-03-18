import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getTradesPaginated } from "@/lib/actions/trades";
import { getAccountStats } from "@/lib/actions/stats";
import { getSymbols, getUsedPairs } from "@/lib/actions/symbols";
import { TradesList } from "@/components/trades/trades-list";
import { TradeForm } from "@/components/trades/trade-form";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId =
    cookieStore.get("activeAccountId")?.value || accounts[0]?.id;

  if (!activeAccountId) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            Seleccioná una cuenta primero
          </p>
        </div>
      </div>
    );
  }

  const account = accounts.find((a) => a.id === activeAccountId);
  const params = await searchParams;
  const [{ trades, hasMore, stats: tradeStats }, accountStats, symbols, usedPairs] = await Promise.all([
    getTradesPaginated(activeAccountId, {
      from: params.from || undefined,
      to: params.to || undefined,
    }),
    getAccountStats(activeAccountId),
    getSymbols(account?.broker || "SIMPLEFX"),
    getUsedPairs(activeAccountId),
  ]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
          Trades
        </h1>
        <TradeForm accountId={activeAccountId} currentCapital={accountStats.currentCapital} symbols={symbols} />
      </div>
      <TradesList
        accountId={activeAccountId}
        accountName={accounts.find((a) => a.id === activeAccountId)?.name || "Trades"}
        initialTrades={trades}
        initialHasMore={hasMore}
        initialStats={tradeStats}
        initialDateFrom={params.from || ""}
        initialDateTo={params.to || ""}
        pairs={usedPairs}
      />
    </div>
  );
}
