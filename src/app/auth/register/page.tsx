"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { TermsModal } from "@/components/auth/terms-modal";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-sm outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass =
  "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "8 caracteres" },
  { test: (p: string) => /[A-Z]/.test(p), label: "1 mayúscula" },
  { test: (p: string) => /[0-9]/.test(p), label: "1 número" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "1 especial (!@#...)" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const ruleResults = useMemo(() => passwordRules.map((r) => r.test(password)), [password]);
  const allRulesPass = ruleResults.every(Boolean);
  const passwordsMatch = password === confirmPassword;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allRulesPass) {
      setError("La contraseña no cumple los requisitos");
      return;
    }
    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmailSent(true);
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
            Crear cuenta
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0e1015] border border-[#252833] rounded-xl p-6">
          {emailSent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#5eead4]/10 flex items-center justify-center">
                <span className="text-[#5eead4] text-xl">✉</span>
              </div>
              <p className="text-[13px] text-[#d4d4d8] font-semibold">
                Revisá tu correo
              </p>
              <p className="text-[12px] text-[#71717a] leading-relaxed">
                Te enviamos un email a <span className="text-[#d4d4d8]">{email}</span> para confirmar tu cuenta. Hacé click en el link del correo para activarla.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-[12px] text-[#5eead4] hover:underline font-mono"
              >
                Ir al login
              </Link>
            </div>
          ) : (
          <>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className={labelClass}>
                Nombre
              </label>
              <input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
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
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className={labelClass}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
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
              {password.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {passwordRules.map((rule, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-mono transition-colors ${
                        ruleResults[i] ? "text-[#4ade80]" : "text-[#52525b]"
                      }`}
                    >
                      {ruleResults[i] ? "\u2713" : "\u2022"} {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repetí tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10 ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? "border-[#f87171]/50 focus:border-[#f87171]"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#71717a] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[10px] text-[#f87171] font-mono mt-1">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#252833] bg-[#1a1d27] accent-[#5eead4] cursor-pointer"
              />
              <span className="text-[11px] text-[#71717a] leading-relaxed">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#5eead4] hover:underline cursor-pointer"
                >
                  términos y condiciones
                </button>
              </span>
            </label>
            {error && (
              <p className="text-sm text-[#f87171] font-mono">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !allRulesPass || !passwordsMatch || !confirmPassword || !acceptedTerms}
              className="w-full bg-[#5eead4] text-[#08090c] py-2.5 rounded-lg font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] text-[#71717a] font-mono">
            Ya tenés cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-[#5eead4] hover:underline"
            >
              Ingresa
            </Link>
          </p>
          </>
          )}
        </div>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
