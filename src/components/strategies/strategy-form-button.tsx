"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StrategyForm } from "./strategy-form";

export function StrategyFormButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#5eead4] text-[#08090c] px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide hover:brightness-110 transition-all cursor-pointer"
      >
        + Nueva estrategia
      </button>
      {open && (
        <StrategyForm
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
