import { cookies } from "next/headers";
import { getUser } from "@/lib/actions/auth";
import { getAccounts, getRiskRules } from "@/lib/actions/accounts";
import { DonationSection } from "@/components/settings/donation-section";
import { RiskRulesSection } from "@/components/settings/risk-rules-section";

export default async function SettingsPage() {
  const user = await getUser();
  const accounts = await getAccounts();
  const cookieStore = await cookies();
  const activeAccountId = cookieStore.get("activeAccountId")?.value || accounts[0]?.id;
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const riskRules = activeAccountId ? await getRiskRules(activeAccountId) : {};

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
        Configuracion
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-[#252833]">
              <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
                Perfil
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-5">
              <div>
                <div className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1 font-mono">
                  Nombre
                </div>
                <div className="text-[#d4d4d8] font-medium">
                  {user.name || "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1 font-mono">
                  Email
                </div>
                <div className="text-[#d4d4d8] font-mono">
                  {user.email}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1 font-mono">
                  Miembro desde
                </div>
                <div className="text-[#d4d4d8] font-mono">
                  {user.createdAt.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {activeAccountId && activeAccount && (
            <RiskRulesSection
              accountId={activeAccountId}
              accountName={activeAccount.name}
              initialRules={riskRules}
            />
          )}
        </div>

        <div id="donate">
          <DonationSection />
        </div>
      </div>
    </div>
  );
}
