"use client";

import { useState } from "react";
import { formatCurrency, calcProgressPct } from "@/lib/calculations";
import { AccountEditDialog } from "./account-edit-dialog";

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

export function AccountCard({ account }: { account: Account }) {
  const [editOpen, setEditOpen] = useState(false);

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
        className="bg-[#0e1015] border border-[#252833] rounded-lg overflow-hidden cursor-pointer hover:border-[#2f3340] transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252833]">
          <span className="text-[#d4d4d8] font-bold text-base tracking-wide">
            {account.name}
          </span>
          <div className="flex items-center gap-2">
            {account.broker && (
              <span className="text-[10px] uppercase tracking-[2px] text-[#52525b] font-mono">
                {account.broker}
              </span>
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

          {/* Wallet */}
          {account.walletAddress && (
            <div className="flex items-center gap-2 bg-[#14161e] rounded-lg px-3 py-2">
              {account.walletNetwork && (
                <span className="text-[9px] uppercase tracking-[1px] text-[#5eead4] font-bold font-mono">
                  {account.walletNetwork}
                </span>
              )}
              <span className="text-[11px] text-[#71717a] font-mono truncate">
                {account.walletAddress}
              </span>
            </div>
          )}

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
