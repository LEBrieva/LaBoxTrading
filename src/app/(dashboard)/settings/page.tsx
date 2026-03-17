import { getUser } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase mb-6">
        Configuración
      </h1>

      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252833]">
          <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
            Perfil
          </h2>
        </div>
        <div className="p-6 space-y-5">
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
    </div>
  );
}
