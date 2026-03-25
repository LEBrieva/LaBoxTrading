"use client";

import { PriceProvider } from "@/contexts/price-context";
import type { ReactNode } from "react";

export function PriceProviderWrapper({
  openPairs,
  decimalsMap,
  contractSizeMap,
  broker,
  children,
}: {
  openPairs: string[];
  decimalsMap: Record<string, number>;
  contractSizeMap: Record<string, number>;
  broker: string;
  children: ReactNode;
}) {
  return (
    <PriceProvider openPairs={openPairs} decimalsMap={decimalsMap} contractSizeMap={contractSizeMap} broker={broker}>
      {children}
    </PriceProvider>
  );
}
