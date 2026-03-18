"use client";

import { useState } from "react";
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
  const [switching, setSwitching] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const accountId = e.target.value;
    setSwitching(true);
    try {
      await setActiveAccount(accountId);
      router.refresh();
    } catch (err) {
      console.error(err);
      setSwitching(false);
    }
  }

  if (accounts.length === 0) return null;

  return (
    <select
      value={activeAccountId}
      onChange={handleChange}
      disabled={switching}
      className={`bg-[#14161e] border border-[#252833] text-[#d4d4d8] font-mono text-[11px] px-3 py-2 rounded outline-none transition-colors cursor-pointer focus:border-[#5eead4] ${
        switching ? "opacity-50 cursor-wait" : ""
      }`}
    >
      {switching ? (
        <option>Cambiando...</option>
      ) : (
        accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}{account.broker ? ` · ${account.broker}` : ""}
          </option>
        ))
      )}
    </select>
  );
}
