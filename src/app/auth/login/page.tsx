"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090c]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#d4d4d8]">
            LA CAJA
          </h1>
          <p className="font-mono text-[10px] text-[#5eead4] opacity-60 tracking-[3px] uppercase mt-1">
            Trading Tracker
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="trader@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-sm outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-sm outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]"
              />
            </div>
            {error && (
              <p className="text-sm text-[#f87171] font-mono">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5eead4] text-[#08090c] py-2.5 rounded-lg font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] text-[#71717a] font-mono">
            No tenes cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-[#5eead4] hover:underline"
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
