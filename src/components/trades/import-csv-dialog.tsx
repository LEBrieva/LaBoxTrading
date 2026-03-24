"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { importSimplefxTrades } from "@/lib/actions/import";
import type { ImportResult } from "@/lib/actions/import";
import { useToast } from "@/components/ui/toast";

interface ImportCsvDialogProps {
  accountId: string;
}

export function ImportCsvDialog({ accountId }: ImportCsvDialogProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { show: toast } = useToast();

  function handleClick() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    if (!file.name.endsWith(".csv")) {
      toast("Solo se permiten archivos .csv", "error");
      return;
    }

    setProcessing(true);
    try {
      const text = await file.text();
      const res = await importSimplefxTrades(accountId, text);
      setResult(res);
      if (res.imported > 0) {
        router.refresh();
      }
    } catch (err) {
      toast(
        "Error al importar: " + (err instanceof Error ? err.message : String(err)),
        "error"
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleClick}
        disabled={processing}
        className="px-3 py-2 rounded-lg border border-[#252833] text-[11px] font-semibold text-[#71717a] hover:border-[#5eead4]/40 hover:text-[#5eead4] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[1px]"
      >
        {processing ? "Importando..." : "Importar CSV"}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
      />

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl px-8 py-6 text-center">
            <div className="w-6 h-6 border-2 border-[#5eead4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#d4d4d8] font-semibold">
              Importando trades...
            </p>
            <p className="text-[11px] text-[#52525b] mt-1">
              Esto puede tardar unos segundos
            </p>
          </div>
        </div>
      )}

      {/* Result dialog */}
      {result && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setResult(null);
          }}
        >
          <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[440px] max-w-[95vw] max-h-[80vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#252833]">
              <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
                Resultado de importacion
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox
                  label="Importados"
                  value={result.imported}
                  color="#4ade80"
                />
                <StatBox
                  label="Duplicados"
                  value={result.duplicates}
                  color="#5eead4"
                />
                <StatBox
                  label="Pendientes"
                  value={result.pending}
                  color="#71717a"
                />
                <StatBox
                  label="Errores"
                  value={result.errors.length}
                  color="#f87171"
                />
              </div>

              {/* Error details */}
              {result.errors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold">
                    Detalle de errores
                  </span>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 bg-[#14161e] border border-[#1a1d27] rounded-lg p-3">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="text-[11px] font-mono text-[#a1a1aa]"
                      >
                        {err.line > 0 && (
                          <span className="text-[#f87171] mr-1">
                            Linea {err.line}:
                          </span>
                        )}
                        <span>{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dismiss button */}
              <div className="flex justify-end pt-2 border-t border-[#252833]">
                <button
                  onClick={() => setResult(null)}
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#14161e] border border-[#1a1d27] rounded-lg p-3 text-center">
      <div className="font-mono text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[1.5px] text-[#52525b] font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}
