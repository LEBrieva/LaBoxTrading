"use client";

import { useState, useEffect } from "react";
import { checkFeedbackEligibility, sendFeedback } from "@/lib/actions/feedback";
import { useToast } from "@/components/ui/toast";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
  } | null>(null);
  const { show: toast } = useToast();

  useEffect(() => {
    if (open && !eligibility) {
      checkFeedbackEligibility().then(setEligibility);
    }
  }, [open, eligibility]);

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await sendFeedback(message);
      if (res.success) {
        toast("Feedback enviado. ¡Gracias!", "success");
        setMessage("");
        setOpen(false);
        setEligibility(null);
      } else {
        toast(res.error || "Error al enviar feedback", "error");
      }
    } catch (err) {
      toast(
        "Error: " + (err instanceof Error ? err.message : String(err)),
        "error"
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-[#52525b] hover:text-[#5eead4] hover:bg-[#5eead4]/5 transition-colors cursor-pointer"
        title="Enviar feedback"
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[480px] max-w-[95vw] animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#252833] flex items-center justify-between">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Enviar feedback
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Loading eligibility */}
              {!eligibility && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#252833] border-t-[#5eead4] rounded-full animate-spin" />
                </div>
              )}

              {/* Not eligible */}
              {eligibility && !eligibility.eligible && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#252833] flex items-center justify-center mx-auto">
                    <span className="text-xl text-[#52525b]">◈</span>
                  </div>
                  <p className="text-[13px] text-[#a1a1aa]">
                    {eligibility.reason}
                  </p>
                  <p className="text-[11px] text-[#52525b]">
                    Queremos asegurarnos de que pruebes la app antes de darnos tu opinión.
                  </p>
                </div>
              )}

              {/* Eligible — show form */}
              {eligibility?.eligible && (
                <>
                  <p className="text-[11px] text-[#52525b]">
                    Contanos qué te parece la app, qué mejorarías, o si encontraste algún bug.
                    Máximo 2000 caracteres.
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Escribí tu feedback acá..."
                    className="w-full bg-[#14161e] border border-[#252833] rounded-lg px-4 py-3 text-[13px] text-[#d4d4d8] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#5eead4]/40 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#3f3f46] font-mono">
                      {message.length}/2000
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOpen(false)}
                        className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[11px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!message.trim() || sending}
                        className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[11px] font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? "Enviando..." : "Enviar"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
