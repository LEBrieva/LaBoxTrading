import Link from "next/link";
import { TermsContent } from "@/components/auth/terms-content";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08090c] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/auth/login" className="inline-block">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#d4d4d8]">
              LA TRADING BOX
            </h1>
          </Link>
        </div>

        <div className="bg-[#0e1015] border border-[#252833] rounded-xl p-6 md:p-8">
          <div className="border-b border-[#252833] pb-4 mb-6">
            <h2 className="text-xl font-extrabold text-[#d4d4d8]">
              Terminos y Condiciones
            </h2>
            <p className="text-[11px] text-[#52525b] font-mono mt-1">
              Ultima actualizacion: Marzo 2026
            </p>
          </div>

          <TermsContent />

          <div className="pt-4 mt-6 border-t border-[#252833]">
            <Link
              href="/auth/register"
              className="text-[12px] text-[#5eead4] hover:underline font-mono"
            >
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
