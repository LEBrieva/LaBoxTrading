"use client";

import { useRouter } from "next/navigation";
import { setActiveAccount } from "@/lib/actions/accounts";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
}

export function AccountSwitcher({
  accounts,
  activeAccountId,
}: {
  accounts: Account[];
  activeAccountId: string;
}) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const accountId = e.target.value;
    await setActiveAccount(accountId);
    router.refresh();
  }

  if (accounts.length === 0) return null;

  return (
    <select
      value={activeAccountId}
      onChange={handleChange}
      className="bg-[#14161e] border border-[#252833] text-[#d4d4d8] font-mono text-[11px] px-3 py-2 rounded outline-none transition-colors cursor-pointer focus:border-[#5eead4]"
    >
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}{account.broker ? ` · ${account.broker}` : ""}
        </option>
      ))}
    </select>
  );
}
