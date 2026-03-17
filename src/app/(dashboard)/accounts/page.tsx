import { getAccounts } from "@/lib/actions/accounts";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AccountCard } from "@/components/accounts/account-card";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
          Cuentas
        </h1>
        <AccountFormDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-2xl text-[#252833]">◈</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            No hay cuentas creadas. Creá una para empezar.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
