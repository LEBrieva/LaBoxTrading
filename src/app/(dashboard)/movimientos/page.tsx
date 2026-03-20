import { Suspense } from "react";
import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getTimelineData } from "@/lib/actions/stats";
import { MovementsList } from "@/components/transactions/movements-list";
import { TransactionForm } from "@/components/transactions/transaction-form";

async function MovimientosSection({ accountId }: { accountId: string }) {
  const { entries, hasMore } = await getTimelineData(accountId);

  return (
    <MovementsList
      accountId={accountId}
      initialEntries={entries}
      initialHasMore={hasMore}
    />
  );
}

function MovimientosSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-[#14161e] border border-[#252833] rounded" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[52px] bg-[#14161e] border border-[#252833] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function MovimientosPage() {
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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
          Movimientos
        </h1>
        <TransactionForm accountId={activeAccountId} />
      </div>
      <Suspense fallback={<MovimientosSkeleton />}>
        <MovimientosSection accountId={activeAccountId} />
      </Suspense>
    </div>
  );
}
