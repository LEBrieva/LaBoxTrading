"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-sm outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass =
  "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090c]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#d4d4d8]">
            LA TRADING BOX
          </h1>
          <p className="font-mono text-[10px] text-[#5eead4] opacity-60 tracking-[3px] uppercase mt-1">
            Recuperar contrasena
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-xl p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#5eead4]/10 flex items-center justify-center">
                <span className="text-[#5eead4] text-xl">✓</span>
              </div>
              <p className="text-[13px] text-[#d4d4d8] font-semibold">
                Email enviado
              </p>
              <p className="text-[12px] text-[#71717a] leading-relaxed">
                Si existe una cuenta con <span className="text-[#d4d4d8]">{email}</span>, vas a recibir un link para restablecer tu contrasena.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-[12px] text-[#5eead4] hover:underline font-mono"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[#71717a] mb-4 leading-relaxed">
                Ingresa tu email y te enviaremos un link para restablecer tu contrasena.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="trader@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className={inputClass}
                  />
                </div>
                {error && (
                  <p className="text-sm text-[#f87171] font-mono">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#5eead4] text-[#08090c] py-2.5 rounded-lg font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
              </form>
              <p className="mt-4 text-center text-[11px] text-[#71717a] font-mono">
                <Link
                  href="/auth/login"
                  className="text-[#5eead4] hover:underline"
                >
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
