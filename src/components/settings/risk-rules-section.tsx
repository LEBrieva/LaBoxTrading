"use client";

import { useState } from "react";
import { updateRiskRules } from "@/lib/actions/accounts";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass = "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

interface RiskRules {
  dailyLossLimit?: number;
  maxRiskPct?: number;
}

export function RiskRulesSection({
  accountId,
  accountName,
  initialRules,
}: {
  accountId: string;
  accountName: string;
  initialRules: RiskRules;
}) {
  const [dailyLossLimit, setDailyLossLimit] = useState(initialRules.dailyLossLimit?.toString() ?? "");
  const [maxRiskPct, setMaxRiskPct] = useState(initialRules.maxRiskPct?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateRiskRules(accountId, {
        dailyLossLimit: dailyLossLimit ? parseFloat(dailyLossLimit) : null,
        maxRiskPct: maxRiskPct ? parseFloat(maxRiskPct) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Error al guardar reglas");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-[#252833] flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[2px] text-[#71717a] font-semibold">
          Reglas de Riesgo
        </h2>
        <span className="text-[10px] text-[#52525b] font-mono">{accountName}</span>
      </div>
      <div className="p-4 md:p-6 space-y-5">
        <p className="text-[11px] text-[#52525b] font-mono">
          Configurá límites para recibir alertas al abrir trades. Dejá vacío para desactivar.
        </p>

        <div className="space-y-1.5">
          <label className={labelClass}>Pérdida diaria máxima (USD)</label>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 100"
            value={dailyLossLimit}
            onChange={(e) => setDailyLossLimit(e.target.value)}
          />
          <p className="text-[9px] text-[#52525b] font-mono">
            Te avisará si ya perdiste este monto en el día al abrir un trade
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Riesgo máximo por trade (%)</label>
          <input
            className={inputClass}
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="Ej: 2"
            value={maxRiskPct}
            onChange={(e) => setMaxRiskPct(e.target.value)}
          />
          <p className="text-[9px] text-[#52525b] font-mono">
            Te avisará si el riesgo del trade supera este porcentaje del capital
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-[#252833]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          {saved && (
            <span className="text-[11px] text-[#4ade80] font-mono animate-in fade-in-0">
              Guardado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
