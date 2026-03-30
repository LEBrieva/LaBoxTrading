"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const DISCORD_URL = "https://discord.gg/CsGB9AwQ";

const WALLETS = [
  { id: "bnb", label: "BNB (BEP20)", tokens: "USDT / USDC / BNB", address: "0xb16525213144a28F7739D27e4a22E09CC6BdF947" },
  { id: "eth", label: "ETH (ERC20)", tokens: "USDT / USDC / ETH", address: "0xb16525213144a28F7739D27e4a22E09CC6BdF947" },
  { id: "btc", label: "BTC", tokens: "BTC", address: "bc1qafqzgkhn7njl256gwxsmt3usl6ayr9nzwnhv04" },
  { id: "sol", label: "SOL", tokens: "SOL / USDT / USDC", address: "Fk6vFDd6JBDL1z48wi265GAUnhuua4zcKDoTmMHjHFZH" },
];

export function Footer() {
  const [donateOpen, setDonateOpen] = useState(false);
  const [selected, setSelected] = useState(WALLETS[0]);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(selected.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <footer className="hidden md:block border-t border-[#252833] bg-[#0e1015]">
        <div className="flex items-center justify-between px-8 py-4">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <Image src="/LTB-logo.png" alt="La Trading Box" width={20} height={20} className="size-5 opacity-50" unoptimized />
            <span className="text-[11px] text-[#52525b] font-mono">
              La Trading Box &copy; {new Date().getFullYear()}
            </span>
          </div>

          {/* Right: links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-[11px] text-[#52525b] hover:text-[#71717a] transition-colors font-mono"
            >
              Términos
            </Link>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#52525b] hover:text-[#7289da] transition-colors font-mono"
            >
              Discord
            </a>
            <button
              onClick={() => setDonateOpen(true)}
              className="text-[11px] text-[#52525b] hover:text-[#f59e0b] transition-colors font-mono cursor-pointer"
            >
              Apoyar
            </button>
            <span className="text-[10px] text-[#3f3f46] font-mono">
              v0.1.0
            </span>
          </div>
        </div>
      </footer>

      {/* Donate modal */}
      {donateOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDonateOpen(false);
          }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[420px] max-w-[95vw] animate-in fade-in-0 zoom-in-95">
            <div className="px-6 py-4 border-b border-[#252833] flex items-center justify-between">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Apoyar el proyecto
              </span>
              <button
                onClick={() => setDonateOpen(false)}
                className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[12px] text-[#a1a1aa] leading-relaxed">
                Si la app te resulta útil, podés dar una mano con una donación voluntaria.
              </p>

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
