"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAccount } from "@/lib/actions/accounts";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass =
  "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  targetCapital: number;
  walletAddress: string | null;
  walletNetwork: string | null;
}

export function AccountEditDialog({
  account,
  open,
  onClose,
}: {
  account: Account;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(account.name);
  const [broker, setBroker] = useState(account.broker || "SIMPLEFX");
  const [targetCapital, setTargetCapital] = useState(
    account.targetCapital.toString()
  );
  const [walletNetwork, setWalletNetwork] = useState(
    account.walletNetwork || ""
  );
  const [walletAddress, setWalletAddress] = useState(
    account.walletAddress || ""
  );
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAccount(account.id, {
        name,
        broker: broker as "SIMPLEFX" | "BITGET",
        targetCapital: parseFloat(targetCapital),
        walletNetwork: walletNetwork || null,
        walletAddress: walletAddress || null,
      });
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[420px] max-w-[95vw] animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#252833]">
          <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
            Editar cuenta
          </span>
          <button
            onClick={onClose}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Broker</label>
            <div className="flex gap-2">
              {(["SIMPLEFX", "BITGET"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBroker(b)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wide transition-colors cursor-pointer ${
                    broker === b
                      ? "bg-[#5eead4]/10 border-[#5eead4]/30 text-[#5eead4]"
                      : "border-[#252833] text-[#71717a] hover:text-[#d4d4d8] hover:bg-[#14161e]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Capital Objetivo (USD)</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              value={targetCapital}
              onChange={(e) => setTargetCapital(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className={labelClass}>Red (opcional)</label>
              <div className="flex gap-2">
                {["BEP20", "ERC20", "TRC20"].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() =>
                      setWalletNetwork(walletNetwork === net ? "" : net)
                    }
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
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
