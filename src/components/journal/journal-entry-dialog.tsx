"use client";

import { useState, useEffect, useRef } from "react";
import { getJournalEntry, upsertJournalEntry, deleteJournalEntry } from "@/lib/actions/journal";
import { useToast } from "@/components/ui/toast";

const MOODS = [
  { value: "GREAT", label: "Excelente", color: "#4ade80", emoji: "🔥" },
  { value: "GOOD", label: "Bien", color: "#5eead4", emoji: "😊" },
  { value: "NEUTRAL", label: "Normal", color: "#71717a", emoji: "😐" },
  { value: "BAD", label: "Mal", color: "#fb923c", emoji: "😞" },
  { value: "TERRIBLE", label: "Terrible", color: "#f87171", emoji: "💀" },
] as const;

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MAX_CHARS = 5000;

interface JournalEntryDialogProps {
  dateKey: string; // "YYYY-MM-DD"
  onClose: () => void;
  onSaved: () => void;
}

export function JournalEntryDialog({ dateKey, onClose, onSaved }: JournalEntryDialogProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("NEUTRAL");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { show: toast } = useToast();

  const [dateYear, dateMonth, dateDay] = dateKey.split("-").map(Number);
  const dateLabel = `${dateDay} de ${MONTHS[dateMonth - 1]} ${dateYear}`;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const entry = await getJournalEntry(dateKey);
        if (entry) {
          setContent(entry.content);
          setMood(entry.mood);
          setTags(entry.tags);
          setEntryId(entry.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateKey]);

  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await upsertJournalEntry({ date: dateKey, content: content.trim(), mood, tags });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast("Error al guardar: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entryId) return;
    setSaving(true);
    try {
      await deleteJournalEntry(entryId);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  const charCount = content.length;
  const nearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0e1015] border border-[#252833] rounded-xl w-[520px] max-w-[95vw] max-h-[95vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252833]">
          <div>
            <span className="text-base font-extrabold tracking-tight text-[#d4d4d8]">
              Diario
            </span>
            <span className="ml-2 text-[12px] text-[#71717a] font-mono">{dateLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="text-[10px] text-[#5eead4] uppercase tracking-[2px] font-mono animate-pulse">
              Cargando...
            </span>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Mood picker */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold">
                Estado de ánimo
              </label>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex-1 py-2 rounded-lg border text-center transition-all cursor-pointer ${
                      mood === m.value ? "" : "border-[#252833] text-[#71717a] hover:bg-[#1a1d27]"
                    }`}
                    style={
                      mood === m.value
                        ? { borderColor: m.color, color: m.color, backgroundColor: `${m.color}15` }
                        : undefined
                    }
                    title={m.label}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span className="hidden md:block text-[9px] mt-0.5">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold">
                  Notas del día
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    nearLimit ? "text-[#fb923c]" : "text-[#3f3f46]"
                  }`}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setContent(e.target.value);
                }}
                rows={8}
                placeholder="¿Cómo fue tu día de trading? ¿Qué emociones sentiste? ¿Qué aprendiste?"
                className="w-full bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4] resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[1.5px] text-[#71717a] font-semibold">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1d27] border border-[#252833] text-[11px] text-[#d4d4d8] font-mono"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-[#52525b] hover:text-[#f87171] transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {tags.length < 10 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    maxLength={50}
                    placeholder="Agregar tag..."
                    className="flex-1 bg-[#1a1d27] border border-[#252833] text-[#d4d4d8] px-3 py-1.5 rounded-lg font-mono text-[12px] outline-none transition-colors placeholder:text-[#52525b] focus:border-[#5eead4]"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-3 py-1.5 rounded-lg border border-[#252833] text-[#71717a] text-[11px] font-semibold hover:border-[#5eead4] hover:text-[#5eead4] transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#252833]">
              <div>
                {entryId && !confirmDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[11px] text-[#52525b] hover:text-[#f87171] transition-colors cursor-pointer"
                  >
                    Eliminar entrada
                  </button>
                )}
                {entryId && confirmDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#f87171]">¿Seguro?</span>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="text-[11px] text-[#f87171] font-bold hover:underline cursor-pointer"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-[11px] text-[#71717a] hover:text-[#d4d4d8] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[13px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="px-5 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Guardando..." : entryId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
