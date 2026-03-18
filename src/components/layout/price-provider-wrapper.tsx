"use client";

import { PriceProvider } from "@/contexts/price-context";
import type { ReactNode } from "react";

export function PriceProviderWrapper({
  openPairs,
  decimalsMap,
  broker,
  children,
}: {
  openPairs: string[];
  decimalsMap: Record<string, number>;
  broker: string;
  children: ReactNode;
}) {
  return (
    <PriceProvider openPairs={openPairs} decimalsMap={decimalsMap} broker={broker}>
      {children}
    </PriceProvider>
  );
}
