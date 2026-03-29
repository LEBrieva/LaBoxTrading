"use client";

import { useState } from "react";

const WALLETS = [
  { id: "bnb", label: "BNB (BEP20)", tokens: "USDT / USDC / BNB", address: "0xb16525213144a28F7739D27e4a22E09CC6BdF947" },
  { id: "eth", label: "ETH (ERC20)", tokens: "USDT / USDC / ETH", address: "0xb16525213144a28F7739D27e4a22E09CC6BdF947" },
  { id: "btc", label: "BTC", tokens: "BTC", address: "bc1qafqzgkhn7njl256gwxsmt3usl6ayr9nzwnhv04" },
  { id: "sol", label: "SOL", tokens: "SOL / USDT / USDC", address: "Fk6vFDd6JBDL1z48wi265GAUnhuua4zcKDoTmMHjHFZH" },
];

export function DonateButton() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(WALLETS[0]);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(selected.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-[#52525b] hover:text-[#f59e0b] hover:bg-[#f59e0b]/5 transition-colors cursor-pointer"
        title="Apoyar el proyecto"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[420px] max-w-[95vw] animate-in fade-in-0 zoom-in-95">
            <div className="px-6 py-4 border-b border-[#252833] flex items-center justify-between">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Apoyar el proyecto
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[12px] text-[#a1a1aa] leading-relaxed">
                Si la app te resulta útil, podés dar una mano con una donación voluntaria.
              </p>

              {/* Network selector */}
              <div className="flex gap-1.5">
                {WALLETS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { setSelected(w); setCopied(false); }}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] uppercase tracking-[1px] font-bold transition-colors cursor-pointer ${
                      selected.id === w.id
                        ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                        : "text-[#52525b] border border-[#252833] hover:text-[#71717a] hover:border-[#2f3340]"
                    }`}
                  >
                    {w.id.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Wallet info */}
              <div className="p-4 bg-[#14161e] border border-[#252833] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-[1px] text-[#5eead4] font-bold font-mono px-1.5 py-0.5 bg-[#5eead4]/10 border border-[#5eead4]/30 rounded">
                    {selected.label}
                  </span>
                  <span className="text-[10px] text-[#71717a] font-mono">{selected.tokens}</span>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] text-[#d4d4d8] font-mono bg-[#1a1d27] px-3 py-2 rounded border border-[#252833] truncate">
                    {selected.address}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      copied
                        ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30"
                        : "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30 hover:brightness-110"
                    }`}
                  >
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[#52525b] font-mono text-center">
                Gracias por ser parte de la comunidad
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
