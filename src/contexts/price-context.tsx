"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ConnectionStatus, PriceClient, PriceQuote } from "@/lib/websocket/types";
import { createPriceClient } from "@/lib/websocket/factory";
import { toWsSymbol, fromWsSymbol, isSymbolSupported } from "@/lib/websocket/symbol-mapping";

export type { ConnectionStatus };

export interface PriceData {
  bid: number;
  ask: number;
  timestamp: number;
}

interface PriceContextValue {
  prices: Record<string, PriceData>;
  status: ConnectionStatus;
  decimalsMap: Record<string, number>;
  contractSizeMap: Record<string, number>;
  subscribePair: (pair: string) => void;
}

const PriceContext = createContext<PriceContextValue>({
  prices: {},
  status: "disconnected",
  decimalsMap: {},
  contractSizeMap: {},
  subscribePair: () => {},
});

export function usePrices() {
  return useContext(PriceContext);
}

const THROTTLE_MS = 1000;

export function PriceProvider({
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
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const pricesRef = useRef<Record<string, PriceData>>({});
  const clientRef = useRef<PriceClient | null>(null);
  const prevPairsRef = useRef<string[]>([]);
  const clientPairsRef = useRef<Set<string>>(new Set());
  const brokerRef = useRef(broker);

  // Create/recreate client when broker changes
  useEffect(() => {
    brokerRef.current = broker;

    // Clear stale prices from previous broker
    pricesRef.current = {};
    setPrices({});
    prevPairsRef.current = [];
    clientPairsRef.current = new Set();

    const client = createPriceClient(broker, {
      onQuote: (quote: PriceQuote) => {
        const appSymbol = fromWsSymbol(quote.symbol, brokerRef.current);
        pricesRef.current[appSymbol] = {
          bid: quote.bid,
          ask: quote.ask,
          timestamp: quote.timestamp,
        };
      },
      onStatusChange: setStatus,
    });

    clientRef.current = client;

    const interval = setInterval(() => {
      const current = pricesRef.current;
      if (Object.keys(current).length > 0) {
        setPrices({ ...current });
      }
    }, THROTTLE_MS);

    return () => {
      clearInterval(interval);
      client.disconnect();
      clientRef.current = null;
    };
  }, [broker]);

  const subscribePair = useCallback((pair: string) => {
    const client = clientRef.current;
    const currentBroker = brokerRef.current;
    if (!client || clientPairsRef.current.has(pair)) return;
    if (!isSymbolSupported(pair, currentBroker)) return;

    clientPairsRef.current.add(pair);

    if (status === "disconnected") {
      client.connect();
    }
    client.subscribe([toWsSymbol(pair, currentBroker)]);
  }, [status]);

  // Manage subscriptions when openPairs changes
  useEffect(() => {
    const client = clientRef.current;
    const currentBroker = brokerRef.current;
    if (!client) return;

    // Filter to supported symbols and merge with client pairs
    const supportedPairs = openPairs.filter((p) => isSymbolSupported(p, currentBroker));
    const allPairs = [...new Set([...supportedPairs, ...clientPairsRef.current])];
    const prev = new Set(prevPairsRef.current);
    const next = new Set(allPairs);

    const toAdd = allPairs.filter((p) => !prev.has(p));
    const toRemove = prevPairsRef.current.filter((p) => !next.has(p));

    if (allPairs.length > 0 && prevPairsRef.current.length === 0) {
      client.connect();
    }

    if (toAdd.length > 0) {
      client.subscribe(toAdd.map((p) => toWsSymbol(p, currentBroker)));
    }

    if (toRemove.length > 0) {
      client.unsubscribe(toRemove.map((p) => toWsSymbol(p, currentBroker)));
    }

    if (allPairs.length === 0 && prevPairsRef.current.length > 0) {
      client.disconnect();
      pricesRef.current = {};
      setPrices({});
    }

    prevPairsRef.current = allPairs;

    for (const p of supportedPairs) {
      clientPairsRef.current.delete(p);
    }
  }, [openPairs]);

  return (
    <PriceContext.Provider value={{ prices, status, decimalsMap, contractSizeMap, subscribePair }}>
      {children}
    </PriceContext.Provider>
  );
}
