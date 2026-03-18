import { Suspense } from "react";
import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getTradesPaginated } from "@/lib/actions/trades";
import { getSymbols, getUsedPairs } from "@/lib/actions/symbols";
import type { Broker } from "@/generated/prisma/client";
import { getStrategies } from "@/lib/actions/strategies";
import { TradesList } from "@/components/trades/trades-list";
import { TradeForm } from "@/components/trades/trade-form";

async function TradeFormSection({ accountId, broker }: { accountId: string; broker: Broker }) {
  const symbols = await getSymbols(broker);
  return <TradeForm accountId={accountId} symbols={symbols} />;
}

async function TradesListSection({
  accountId,
  accountName,
  from,
  to,
}: {
  accountId: string;
  accountName: string;
  from?: string;
  to?: string;
}) {
  const [{ trades, hasMore, stats: tradeStats }, usedPairs, strategies] = await Promise.all([
    getTradesPaginated(accountId, {
      from: from || undefined,
      to: to || undefined,
    }),
    getUsedPairs(accountId),
    getStrategies(),
  ]);

  return (
    <TradesList
      accountId={accountId}
      accountName={accountName}
      initialTrades={trades}
      initialHasMore={hasMore}
      initialStats={tradeStats}
      initialDateFrom={from || ""}
      initialDateTo={to || ""}
      pairs={usedPairs}
      strategies={strategies}
    />
  );
}

function TradeFormSkeleton() {
  return (
    <div className="h-9 w-[130px] bg-[#14161e] border border-[#252833] rounded-lg animate-pulse" />
  );
}

function TradesListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-[#14161e] border border-[#252833] rounded" />
          ))}
        </div>
        <div className="w-px h-6 bg-[#252833]" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-14 bg-[#14161e] border border-[#252833] rounded" />
          ))}
        </div>
      </div>
      {/* Trade cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[180px] bg-[#14161e] border border-[#252833] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
          Trades
        </h1>
        <Suspense fallback={<TradeFormSkeleton />}>
          <TradeFormSection accountId={activeAccountId} broker={(account?.broker || "SIMPLEFX") as Broker} />
        </Suspense>
      </div>
      <Suspense fallback={<TradesListSkeleton />}>
        <TradesListSection
          accountId={activeAccountId}
          accountName={account?.name || "Trades"}
          from={params.from}
          to={params.to}
        />
      </Suspense>
    </div>
  );
}
