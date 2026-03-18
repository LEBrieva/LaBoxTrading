"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStrategy } from "@/lib/actions/strategies";
import { StrategyForm } from "./strategy-form";
import type { StrategyFieldDef } from "@/lib/types/strategy";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  fields: unknown;
}

const typeLabels: Record<string, string> = {
  checkbox: "Check",
  range: "Rango",
  text: "Texto",
  select: "Selector",
};

export function StrategyCard({ strategy }: { strategy: Strategy }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const fields = strategy.fields as StrategyFieldDef[];

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteStrategy(strategy.id);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden hover:border-[#2f3340] transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252833]">
          <div>
            <span className="text-[#d4d4d8] font-bold text-base">{strategy.name}</span>
            {strategy.description && (
              <p className="text-[11px] text-[#71717a] mt-0.5 max-w-[300px] truncate">
                {strategy.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="text-[10px] text-[#71717a] hover:text-[#5eead4] transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              disabled={deleting}
              className={`text-[10px] transition-colors cursor-pointer ${
                confirmDelete ? "text-[#f87171]" : "text-[#71717a] hover:text-[#f87171]"
              }`}
            >
              {confirmDelete ? "Confirmar" : "Eliminar"}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-2">
            {fields.length} {fields.length === 1 ? "campo" : "campos"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f) => (
              <span
                key={f.id}
                className="px-2 py-1 rounded border border-[#252833] text-[10px] font-mono text-[#a1a1aa] bg-[#14161e]"
              >
                {f.label}
                <span className="ml-1 text-[#52525b]">{typeLabels[f.type] || f.type}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {editOpen && (
        <StrategyForm
          strategy={strategy}
          onClose={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
