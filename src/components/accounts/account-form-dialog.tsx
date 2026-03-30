"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/lib/actions/accounts";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass =
  "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

export function AccountFormDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [broker, setBroker] = useState("SIMPLEFX");
  const [initialCapital, setInitialCapital] = useState("");
  const [targetCapital, setTargetCapital] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createAccount({
        name,
        broker: broker as "SIMPLEFX" | "BITGET",
        initialCapital: initialCapital === "" ? 0 : parseFloat(initialCapital),
        targetCapital: targetCapital === "" ? 0 : parseFloat(targetCapital),
        walletAddress: walletAddress || undefined,
        walletNetwork: walletNetwork || undefined,
      });
      setOpen(false);
      setName("");
      setBroker("SIMPLEFX");
      setInitialCapital("");
      setTargetCapital("");
      setWalletAddress("");
      setWalletNetwork("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#5eead4] text-[#08090c] px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide hover:brightness-110 transition-all cursor-pointer"
      >
        + Nueva cuenta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[420px] max-w-[95vw] animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#252833]">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Nueva cuenta
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-4 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Nombre</label>
                <input
                  className={inputClass}
                  placeholder="SimpleFX Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Broker</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wide bg-[#5eead4]/10 border-[#5eead4]/30 text-[#5eead4]"
                  >
                    SIMPLEFX
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wide border-[#252833] text-[#52525b] cursor-not-allowed relative"
                  >
                    BITGET
                    <span className="absolute -top-2 -right-2 bg-[#5eead4]/20 text-[#5eead4] text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider">
                      SOON
                    </span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Capital Inicial (USD)</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                  />
                  <p className="text-[10px] text-[#52525b] font-mono">Si no lo recordás, dejalo en 0</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Capital Objetivo (USD)</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={targetCapital}
                    onChange={(e) => setTargetCapital(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-[#f87171] font-mono">{error}</p>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Red (opcional)</label>
                  <div className="flex gap-2">
                    {["BEP20", "ERC20", "TRC20"].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setWalletNetwork(walletNetwork === net ? "" : net)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wide transition-colors cursor-pointer ${
                          walletNetwork === net
                            ? "bg-[#5eead4]/10 border-[#5eead4]/30 text-[#5eead4]"
                            : "border-[#252833] text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#14161e]"
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Dirección wallet (opcional)</label>
                  <input
                    className={inputClass}
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#252833]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creando..." : "Crear cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
