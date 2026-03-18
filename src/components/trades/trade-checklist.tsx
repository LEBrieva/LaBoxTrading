"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTradeChecklist, deleteTradeChecklist } from "@/lib/actions/trade-checklist";
import type { StrategyFieldDef, ChecklistValues } from "@/lib/types/strategy";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";

interface Strategy {
  id: string;
  name: string;
  fields: unknown;
}

interface Checklist {
  id: string;
  strategyId: string | null;
  strategy: Strategy | null;
  values: unknown;
}

export function TradeChecklist({
  tradeId,
  checklist,
  strategies,
}: {
  tradeId: string;
  checklist: Checklist | null;
  strategies: Strategy[];
}) {
  const router = useRouter();
  const [selectedStrategyId, setSelectedStrategyId] = useState(checklist?.strategyId || "");
  const [values, setValues] = useState<ChecklistValues>(
    (checklist?.values as ChecklistValues) || {}
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const activeStrategy = checklist?.strategy || strategies.find((s) => s.id === selectedStrategyId);
  const fields = (activeStrategy?.fields as StrategyFieldDef[]) || [];
  const hasChecklist = !!checklist;
  const isLoading = saving || removing;

  const loadingOverlay = isLoading ? (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0e1015]/70 backdrop-blur-sm rounded-lg">
      <div className="w-6 h-6 border-2 border-[#5eead4]/30 border-t-[#5eead4] rounded-full animate-spin" />
      <p className="text-[11px] text-[#d4d4d8] font-mono tracking-[1px]">
        {saving ? "Guardando..." : "Quitando..."}
      </p>
    </div>
  ) : null;

  function setValue(fieldId: string, value: string | boolean | number) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSave() {
    if (!activeStrategy) return;
    setSaving(true);
    try {
      await saveTradeChecklist({
        tradeId,
        strategyId: activeStrategy.id,
        values,
      });
      router.refresh();
      // Keep saving=true until refresh re-mounts with new data
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  async function handleAssociate() {
    if (!selectedStrategyId) return;
    setSaving(true);
    try {
      await saveTradeChecklist({
        tradeId,
        strategyId: selectedStrategyId,
        values: {},
      });
      router.refresh();
      // Keep saving=true until refresh re-mounts with new data
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await deleteTradeChecklist(tradeId);
      setValues({});
      setSelectedStrategyId("");
      router.refresh();
      // Keep removing=true until refresh re-mounts with new data
    } catch (err) {
      console.error(err);
      setRemoving(false);
    }
  }

  // No checklist yet — show strategy selector
  if (!hasChecklist) {
    if (strategies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="text-lg text-[#252833]">◇</span>
          <p className="text-[11px] text-[#52525b] tracking-[1px]">
            No hay estrategias creadas
          </p>
          <p className="text-[10px] text-[#3f3f46]">
            Creá una en la sección Estrategias
          </p>
        </div>
      );
    }

    return (
      <div className="relative space-y-4 py-4">
        {loadingOverlay}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono">
            Seleccionar estrategia
          </label>
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Elegir estrategia...</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {selectedStrategyId && (
          <button
            onClick={handleAssociate}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Asociando..." : "Asociar estrategia"}
          </button>
        )}
      </div>
    );
  }

  // Strategy was deleted
  if (!activeStrategy) {
    return (
      <div className="relative space-y-4 py-4">
        {loadingOverlay}
        <div className="px-3 py-2 bg-[#f87171]/10 border border-[#f87171]/20 rounded-lg">
          <p className="text-[11px] text-[#f87171] font-mono">Estrategia eliminada</p>
        </div>
        {Object.keys(values).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-[#52525b] uppercase tracking-[1px]">Valores guardados</p>
            {Object.entries(values).map(([k, v]) => (
              <div key={k} className="flex justify-between px-2 py-1 text-[11px] font-mono text-[#71717a]">
                <span>{k}</span>
                <span className="text-[#d4d4d8]">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-[10px] text-[#f87171] hover:text-[#f87171]/80 font-mono cursor-pointer"
        >
          {removing ? "Quitando..." : "Quitar"}
        </button>
      </div>
    );
  }

  // Has checklist — render dynamic form
  return (
    <div className="relative space-y-4 py-4">
      {loadingOverlay}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#5eead4] font-mono uppercase tracking-[1px]">
          {activeStrategy.name}
        </span>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-[10px] text-[#71717a] hover:text-[#f87171] font-mono transition-colors cursor-pointer"
        >
          {removing ? "Quitando..." : "Quitar estrategia"}
        </button>
      </div>

      <div className="space-y-3">
        {fields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono">
                {field.label}
                {field.type === "range" && field.min != null && field.max != null && (
                  <span className="ml-1 text-[#52525b] normal-case">({field.min}-{field.max})</span>
                )}
              </label>

              {field.type === "checkbox" && (
                <button
                  type="button"
                  onClick={() => setValue(field.id, !values[field.id])}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wide transition-colors cursor-pointer ${
                    values[field.id]
                      ? "bg-[#5eead4]/10 border-[#5eead4]/30 text-[#5eead4]"
                      : "border-[#252833] text-[#52525b] hover:text-[#d4d4d8] hover:bg-[#14161e]"
                  }`}
                >
                  <span className={`inline-block w-3 h-3 rounded border transition-colors ${
                    values[field.id] ? "bg-[#5eead4] border-[#5eead4]" : "border-[#52525b]"
                  }`}>
                    {values[field.id] && <span className="block text-[8px] text-[#08090c] leading-3 text-center font-black">✓</span>}
                  </span>
                  {values[field.id] ? "Si" : "No"}
                </button>
              )}

              {field.type === "range" && (
                <input
                  type="number"
                  className={inputClass}
                  placeholder={field.min != null && field.max != null ? `${field.min} - ${field.max}` : "Valor"}
                  value={String(values[field.id] ?? "")}
                  onChange={(e) => setValue(field.id, e.target.value ? Number(e.target.value) : "")}
                />
              )}

              {field.type === "text" && (
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="..."
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === "select" && (
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={String(values[field.id] ?? "")}
                  onChange={(e) => setValue(field.id, e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Guardando..." : "Guardar checklist"}
      </button>
    </div>
  );
}
