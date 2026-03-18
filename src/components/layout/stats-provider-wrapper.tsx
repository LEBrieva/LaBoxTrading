"use client";

import { StatsProvider } from "@/contexts/stats-context";
import type { ReactNode } from "react";

export function StatsProviderWrapper({
  accountId,
  fallback,
  children,
}: {
  accountId: string;
  fallback: { currentCapital: number; initialCapital: number; targetCapital: number };
  children: ReactNode;
}) {
  return (
    <StatsProvider accountId={accountId} fallback={fallback}>
      {children}
    </StatsProvider>
  );
}
