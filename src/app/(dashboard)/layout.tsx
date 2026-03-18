import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getOpenTradePairs, getSymbolDecimalsMap } from "@/lib/actions/symbols";
import { AccountSwitcherWrapper } from "@/components/layout/account-switcher-wrapper";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PriceProviderWrapper } from "@/components/layout/price-provider-wrapper";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { formatCurrency } from "@/lib/calculations";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get("activeAccountId")?.value || accounts[0]?.id || "";
  const account = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const broker = account?.broker || "SIMPLEFX";

  const [openPairs, decimalsMap] = await Promise.all([
    getOpenTradePairs(),
    getSymbolDecimalsMap(broker),
  ]);

  return (
    <PriceProviderWrapper openPairs={openPairs} decimalsMap={decimalsMap} broker={broker}>
      <div className="min-h-screen bg-[#08090c]">
        <header className="sticky top-0 z-50 bg-[#0e1015] border-b border-[#252833]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-8 md:py-5 gap-2 md:gap-0">
            <div className="flex items-baseline gap-3">
              <span
                className="text-xl font-bold tracking-wider text-[#d4d4d8] uppercase"
                style={{ textShadow: "0 0 30px rgba(94,234,212,0.08)" }}
              >
                La Caja
              </span>
              <span className="hidden md:inline font-mono text-[10px] text-[#5eead4] tracking-[3px] uppercase opacity-60">
                Trading Tracker
              </span>
              <ConnectionStatus />
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              {account && (
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-[2px] text-[#71717a] font-mono">Capital</div>
                  <div
                    className="font-mono text-base md:text-xl font-bold text-[#4ade80]"
                    style={{ textShadow: "0 0 20px rgba(74,222,128,0.15)" }}
                  >
                    {formatCurrency(account.currentCapital, account.currency)}
                  </div>
                  <div className="font-mono text-[10px] text-[#52525b]">
                    inicio: {formatCurrency(account.initialCapital)}
                  </div>
                </div>
              )}
              <AccountSwitcherWrapper accounts={accounts} activeAccountId={activeAccountId} />
            </div>
          </div>
          <NavLinks />
        </header>
        <main className="pb-20 md:pb-0">{children}</main>
        <MobileBottomNav />
      </div>
    </PriceProviderWrapper>
  );
}
