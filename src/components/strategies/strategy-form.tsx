"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStrategy, updateStrategy } from "@/lib/actions/strategies";
import type { StrategyFieldDef, FieldType } from "@/lib/types/strategy";

const inputClass =
  "w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]";
const labelClass =
  "text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold font-mono";

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "checkbox", label: "Check" },
  { value: "range", label: "Rango" },
  { value: "text", label: "Texto" },
  { value: "select", label: "Selector" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface Props {
  strategy?: {
    id: string;
    name: string;
    description: string | null;
    fields: unknown;
  };
  onClose: () => void;
}

export function StrategyForm({ strategy, onClose }: Props) {
  const isEditing = !!strategy;
  const existingFields = (strategy?.fields as StrategyFieldDef[]) || [];

  const [name, setName] = useState(strategy?.name || "");
  const [description, setDescription] = useState(strategy?.description || "");
  const [fields, setFields] = useState<StrategyFieldDef[]>(
    existingFields.length > 0
      ? existingFields
      : [{ id: generateId(), label: "", type: "checkbox", order: 0 }]
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const router = useRouter();

  function addField() {
    setFields([
      ...fields,
      { id: generateId(), label: "", type: "checkbox", order: fields.length },
    ]);
  }

  function removeField(id: string) {
    if (fields.length <= 1) return;
    setFields(fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
  }

  function moveField(id: string, direction: "up" | "down") {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next.map((f, i) => ({ ...f, order: i })));
  }

  function updateField(id: string, updates: Partial<StrategyFieldDef>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanFields = fields
        .filter((f) => f.label.trim())
        .map((f, i) => ({ ...f, label: f.label.trim(), order: i }));

      if (cleanFields.length === 0) return;

      if (isEditing) {
        await updateStrategy(strategy.id, { name, description: description || null, fields: cleanFields });
      } else {
        await createStrategy({ name, description: description || undefined, fields: cleanFields });
      }
      onClose();
      startRefresh(() => router.refresh());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    {refreshing && (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-[#0e1015] border border-[#252833] rounded-xl px-6 py-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#5eead4] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#d4d4d8] font-semibold">Cargando...</span>
        </div>
      </div>
    )}
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => {}}
    >
      <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#252833]">
          <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
            {isEditing ? "Editar estrategia" : "Nueva estrategia"}
          </span>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 md:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              placeholder="La Caja, Breakout, ICT..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Descripcion (opcional)</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Descripcion breve de la estrategia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between sticky top-0 z-10 bg-[#0e1015] py-2 -mt-2">
              <label className={labelClass}>Campos del checklist</label>
              <button
                type="button"
                onClick={addField}
                className="text-[10px] text-[#5eead4] hover:text-[#5eead4]/80 font-semibold transition-colors cursor-pointer"
              >
                + Agregar campo
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 bg-[#14161e] border border-[#252833] rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "up")}
                        disabled={idx === 0}
                        className="text-[9px] text-[#52525b] hover:text-[#5eead4] disabled:opacity-20 disabled:cursor-default cursor-pointer leading-none"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, "down")}
                        disabled={idx === fields.length - 1}
                        className="text-[9px] text-[#52525b] hover:text-[#5eead4] disabled:opacity-20 disabled:cursor-default cursor-pointer leading-none"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      className={`${inputClass} flex-1`}
                      placeholder="Nombre del campo"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                    />
                    <div className="flex gap-1">
                      {fieldTypes.map((ft) => (
                        <button
                          key={ft.value}
                          type="button"
                          onClick={() => updateField(field.id, { type: ft.value, options: ft.value === "select" ? [""] : undefined, min: undefined, max: undefined })}
                          className={`px-2 py-1 rounded border text-[9px] font-bold font-mono tracking-wide transition-colors cursor-pointer ${
                            field.type === ft.value
                              ? "bg-[#5eead4]/10 border-[#5eead4]/30 text-[#5eead4]"
                              : "border-[#252833] text-[#52525b] hover:text-[#d4d4d8]"
                          }`}
                        >
                          {ft.label}
                        </button>
                      ))}
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="text-[#52525b] hover:text-[#f87171] text-sm transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {field.type === "range" && (
                    <div className="flex gap-2 pl-6">
                      <input
                        className={`${inputClass} w-20`}
                        type="number"
                        placeholder="Min"
                        value={field.min ?? ""}
                        onChange={(e) => updateField(field.id, { min: e.target.value ? Number(e.target.value) : undefined })}
                      />
                      <input
                        className={`${inputClass} w-20`}
                        type="number"
                        placeholder="Max"
                        value={field.max ?? ""}
                        onChange={(e) => updateField(field.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  )}

                  {field.type === "select" && (
                    <div className="pl-6">
                      <input
                        className={inputClass}
                        placeholder="Opciones separadas por coma (ej: alcista, bajista, ninguna)"
                        value={(field.options || []).join(", ")}
                        onChange={(e) =>
                          updateField(field.id, {
                            options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
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
              disabled={loading || !name.trim() || fields.every((f) => !f.label.trim())}
              className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Guardando..." : isEditing ? "Guardar" : "Crear estrategia"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
