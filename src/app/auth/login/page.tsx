"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(translateAuthError(error.message));
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
          <Image src="/LTB-logo.png" alt="La Trading Box" width={64} height={64} className="mx-auto mb-4 size-16" unoptimized />
          <h1 className="text-3xl font-extrabold tracking-tight text-[#d4d4d8]">
            LA TRADING BOX
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
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 pr-10 rounded-lg font-mono text-sm outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#71717a] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
          <p className="mt-3 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-[11px] text-[#52525b] hover:text-[#71717a] font-mono transition-colors"
            >
              Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="mt-2 text-center text-[11px] text-[#71717a] font-mono">
            No tenés cuenta?{" "}
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
