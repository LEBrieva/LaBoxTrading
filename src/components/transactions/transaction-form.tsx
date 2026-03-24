"use client";

import { useState } from "react";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { useToast } from "@/components/ui/toast";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass = "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

interface TransactionFormProps {
  accountId: string;
  editData?: {
    id: string;
    type: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
    amount: number;
    date: string;
    note: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({ accountId, editData, onSuccess, onCancel }: TransactionFormProps) {
  const { show: toast } = useToast();
  const isEdit = !!editData;
  const [open, setOpen] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT">(editData?.type ?? "DEPOSIT");
  const [amount, setAmount] = useState(editData?.amount?.toString() ?? "");
  const [date, setDate] = useState(editData?.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState(editData?.note ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && editData) {
        await updateTransaction(editData.id, {
          type,
          amount: parseFloat(amount),
          date,
          note: note || null,
        });
      } else {
        await createTransaction({
          accountId,
          type,
          amount: parseFloat(amount),
          date,
          note: note || undefined,
        });
      }
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast("Error: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setType("DEPOSIT");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
  }

  function handleClose() {
    setOpen(false);
    resetForm();
    onCancel?.();
  }

  if (isEdit && !open) return null;

  return (
    <>
      {!isEdit && (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#5eead4] text-[#08090c] px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide hover:brightness-110 transition-all hover:-translate-y-[1px] cursor-pointer"
        >
          + Registrar movimiento
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[420px] max-w-[95vw] max-h-[95vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#252833]">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                {isEdit ? "Editar movimiento" : "Nuevo movimiento"}
              </span>
              <button onClick={handleClose} className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div className="space-y-2">
                <label className={labelClass}>Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("DEPOSIT")}
                    className={`py-2.5 rounded-lg border font-bold text-[13px] transition-all cursor-pointer ${
                      type === "DEPOSIT"
                        ? "bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]"
                        : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27]"
                    }`}
                  >
                    Depósito
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("WITHDRAWAL")}
                    className={`py-2.5 rounded-lg border font-bold text-[13px] transition-all cursor-pointer ${
                      type === "WITHDRAWAL"
                        ? "bg-[#f87171]/10 border-[#f87171] text-[#f87171]"
                        : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27]"
                    }`}
                  >
                    Retiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("ADJUSTMENT")}
                    className={`py-2.5 rounded-lg border font-bold text-[13px] transition-all cursor-pointer ${
                      type === "ADJUSTMENT"
                        ? "bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]"
                        : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27]"
                    }`}
                  >
                    Ajuste
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Monto (USD){type === "ADJUSTMENT" && <span className="text-[#fbbf24] ml-1">puede ser negativo</span>}
                </label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min={type === "ADJUSTMENT" ? undefined : "0.01"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder={type === "ADJUSTMENT" ? "-1.50 o 2.30" : "0.00"}
                  autoFocus
                />
                {type === "ADJUSTMENT" && (
                  <p className="text-[9px] text-[#52525b] font-mono">
                    Positivo suma al capital, negativo resta. Para corregir desfasajes acumulados.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Fecha</label>
                <input
                  className={inputClass}
                  type="date"
                  value={date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Nota (opcional)</label>
                <input
                  className={inputClass}
                  placeholder="Ej: Fondeo inicial, retiro ganancias..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#252833]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Guardando..." : isEdit ? "Guardar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
