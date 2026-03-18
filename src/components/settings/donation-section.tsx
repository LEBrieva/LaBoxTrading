"use client";

import { useState } from "react";

const WALLET_ADDRESS = "0x0000000000000000000000000000000000000000";
const NETWORK = "BEP20";

export function DonationSection() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-[#252833]">
        <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
          Apoyar el proyecto
        </h2>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
          La Caja es una herramienta gratuita, construida por traders para traders.
          Mantenerla online, mejorarla y agregar nuevas funciones lleva tiempo y recursos.
        </p>
        <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
          Si te resulta util y queres dar una mano, podes hacerlo con una donacion voluntaria.
          No es obligatorio, pero se agradece mucho. Cada aporte ayuda a que el proyecto siga creciendo
          y llegue a mas personas de la comunidad.
        </p>

        <div className="mt-4 p-4 bg-[#14161e] border border-[#252833] rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-[1px] text-[#5eead4] font-bold font-mono px-1.5 py-0.5 bg-[#5eead4]/10 border border-[#5eead4]/30 rounded">
              {NETWORK}
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">USDT / USDC / BNB</span>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] text-[#d4d4d8] font-mono bg-[#1a1d27] px-3 py-2 rounded border border-[#252833] truncate">
              {WALLET_ADDRESS}
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

        <p className="text-[10px] text-[#52525b] font-mono text-center pt-2">
          Gracias por ser parte de la comunidad
        </p>
      </div>
    </div>
  );
}
