import { cookies } from "next/headers";
import { getAccounts } from "@/lib/actions/accounts";
import { getUser } from "@/lib/actions/auth";
import { getOpenTradePairs, getSymbolDecimalsMap, getContractSizeMap } from "@/lib/actions/symbols";
import { AccountSwitcherWrapper } from "@/components/layout/account-switcher-wrapper";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PriceProviderWrapper } from "@/components/layout/price-provider-wrapper";
import { StatsProviderWrapper } from "@/components/layout/stats-provider-wrapper";
import { HeaderStats } from "@/components/layout/header-stats";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { PrivacyProvider } from "@/contexts/privacy-context";
import { PrivacyToggle } from "@/components/layout/privacy-toggle";
import { FeedbackButton } from "@/components/layout/feedback-button";
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get("activeAccountId")?.value || accounts[0]?.id || "";
  const account = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const broker = account?.broker || "SIMPLEFX";

  const [openPairs, decimalsMap, contractSizeMap] = await Promise.all([
    getOpenTradePairs(),
    getSymbolDecimalsMap(broker),
    getContractSizeMap(broker),
  ]);

  return (
    <PrivacyProvider>
      <PriceProviderWrapper openPairs={openPairs} decimalsMap={decimalsMap} contractSizeMap={contractSizeMap} broker={broker}>
        <StatsProviderWrapper
          key={activeAccountId}
          accountId={activeAccountId}
          fallback={{
            currentCapital: account?.currentCapital ?? 0,
            initialCapital: account?.initialCapital ?? 0,
            targetCapital: account?.targetCapital ?? 0,
          }}
        >
          <div className="min-h-screen bg-[#08090c]">
            <header className="sticky top-0 z-50 bg-[#0e1015] border-b border-[#252833]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 md:px-8 md:py-5 gap-2 md:gap-0">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-xl font-bold tracking-wider text-[#d4d4d8] uppercase"
                    style={{ textShadow: "0 0 30px rgba(94,234,212,0.08)" }}
                  >
                    La Trading Box
                  </span>
                  <ConnectionStatus />
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  {account && <HeaderStats currency={account.currency} />}
                  <FeedbackButton />
                  <PrivacyToggle />
                  <AccountSwitcherWrapper accounts={accounts} activeAccountId={activeAccountId} />
                </div>
              </div>
              <NavLinks />
            </header>
            <main className="pb-20 md:pb-0">{children}</main>
            <MobileBottomNav />
            <OnboardingWrapper showTour={!user.hasCompletedOnboarding} />
          </div>
        </StatsProviderWrapper>
      </PriceProviderWrapper>
    </PrivacyProvider>
  );
}
