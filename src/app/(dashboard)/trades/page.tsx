import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getTrades } from "@/lib/actions/trades";
import { TradesList } from "@/components/trades/trades-list";

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

  const trades = await getTrades(activeAccountId);
  const params = await searchParams;

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase mb-6">
        Trades
      </h1>
      <TradesList
        trades={trades}
        initialDateFrom={params.from || ""}
        initialDateTo={params.to || ""}
      />
    </div>
  );
}
