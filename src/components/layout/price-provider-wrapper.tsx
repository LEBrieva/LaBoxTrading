"use client";

import { PriceProvider } from "@/contexts/price-context";
import type { ReactNode } from "react";

export function PriceProviderWrapper({
  openPairs,
  decimalsMap,
  children,
}: {
  openPairs: string[];
  decimalsMap: Record<string, number>;
  children: ReactNode;
}) {
  return (
    <PriceProvider openPairs={openPairs} decimalsMap={decimalsMap}>
      {children}
    </PriceProvider>
  );
}
