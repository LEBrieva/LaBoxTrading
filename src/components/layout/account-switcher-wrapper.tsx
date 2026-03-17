"use client";

import dynamic from "next/dynamic";

const AccountSwitcher = dynamic(
  () => import("@/components/layout/account-switcher").then((m) => m.AccountSwitcher),
  { ssr: false }
);

interface Account {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
}

export function AccountSwitcherWrapper({
  accounts,
  activeAccountId,
}: {
  accounts: Account[];
  activeAccountId: string;
}) {
  return <AccountSwitcher accounts={accounts} activeAccountId={activeAccountId} />;
}
