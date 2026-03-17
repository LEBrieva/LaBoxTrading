"use client";

import { useState } from "react";
import { formatCurrency, calcProgressPct } from "@/lib/calculations";
import { AccountEditDialog } from "./account-edit-dialog";
import { useToast } from "@/components/ui/toast";

interface Account {
  id: string;
  name: string;
  broker: string | null;
  initialCapital: number;
  currentCapital: number;
  targetCapital: number;
  currency: string;
  walletAddress: string | null;
  walletNetwork: string | null;
}

export function AccountCard({
  account,
  isActive,
}: {
  account: Account;
  isActive: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { show } = useToast();

  function copyWallet(e: React.MouseEvent) {
    e.stopPropagation();
    if (!account.walletAddress) return;
    navigator.clipboard.writeText(account.walletAddress);
    show("Dirección copiada al portapapeles");
  }

  const progress = calcProgressPct(
    account.currentCapital,
    account.initialCapital,
    account.targetCapital
  );
  const pnl = account.currentCapital - account.initialCapital;
  const pnlIsPositive = pnl >= 0;

  return (
    <>
      <div
        onClick={() => setEditOpen(true)}
        className={`bg-[#0e1015] rounded-lg overflow-hidden cursor-pointer transition-colors ${
          isActive
            ? "border-2 border-[#5eead4]/40 hover:border-[#5eead4]/60"
            : "border border-[#252833] hover:border-[#2f3340]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252833]">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-[#5eead4] shrink-0" />
            )}
            <span className="text-[#d4d4d8] font-bold text-base">
              {account.name}
            </span>
            {account.broker && (
              <span className="text-[10px] uppercase tracking-[2px] text-[#52525b] font-mono">
                {account.broker}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {account.walletAddress && (
              <button
                onClick={copyWallet}
                className="flex items-center gap-1.5 bg-[#14161e] rounded px-2 py-1 hover:bg-[#1a1d27] transition-colors cursor-pointer"
                title="Copiar dirección"
              >
                {account.walletNetwork && (
                  <span className="text-[8px] uppercase tracking-[1px] text-[#5eead4] font-bold font-mono">
                    {account.walletNetwork}
                  </span>
                )}
                <span className="text-[10px] text-[#71717a] font-mono max-w-[100px] truncate">
                  {account.walletAddress}
                </span>
                <span className="text-[10px] text-[#52525b]">⧉</span>
              </button>
            )}
            <span className="text-[10px] text-[#52525b]">✎</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Capital */}
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[2px] text-[#52525b] mb-1">
              Capital Actual
            </div>
            <div className="font-mono text-2xl font-bold text-[#d4d4d8]">
              {formatCurrency(account.currentCapital, account.currency)}
            </div>
            <div
              className={`font-mono text-[12px] mt-1 ${
                pnlIsPositive ? "text-[#4ade80]" : "text-[#f87171]"
              }`}
            >
              {pnlIsPositive ? "+" : ""}${Math.abs(pnl).toFixed(2)}
            </div>
          </div>

          {/* Inicio / Objetivo */}
          <div className="flex justify-between text-[10px] text-[#71717a] font-mono">
            <span>Inicio: {formatCurrency(account.initialCapital)}</span>
            <span>Objetivo: {formatCurrency(account.targetCapital)}</span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-1.5 bg-[#1a1d27] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                  backgroundColor: progress >= 100 ? "#4ade80" : "#5eead4",
                }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="font-mono text-[10px] text-[#5eead4]">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <AccountEditDialog
        account={account}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
