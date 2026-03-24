"use client";

import { useEffect } from "react";
import { TermsContent } from "./terms-content";

interface TermsModalProps {
  onClose: () => void;
}

export function TermsModal({ onClose }: TermsModalProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#0e1015] border border-[#252833] rounded-xl w-[600px] max-w-[95vw] max-h-[85vh] flex flex-col"
        style={{
          animation: "terms-expand 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252833] shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-[#d4d4d8]">
              Terminos y Condiciones
            </h2>
            <p className="text-[10px] text-[#52525b] font-mono mt-0.5">
              Ultima actualizacion: Marzo 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1">
          <TermsContent />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#252833] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes terms-expand {
          0% {
            opacity: 0;
            transform: scaleY(0.3) scaleX(0.95);
          }
          100% {
            opacity: 1;
            transform: scaleY(1) scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
