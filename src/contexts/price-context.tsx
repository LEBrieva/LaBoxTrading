"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SimpleFXClient, type ConnectionStatus, type SimpleFXQuote } from "@/lib/websocket/simplefx-client";

export interface PriceData {
  bid: number;
  ask: number;
  timestamp: number;
}

interface PriceContextValue {
  prices: Record<string, PriceData>;
  status: ConnectionStatus;
  decimalsMap: Record<string, number>;
  subscribePair: (pair: string) => void;
}

const PriceContext = createContext<PriceContextValue>({
  prices: {},
  status: "disconnected",
  decimalsMap: {},
  subscribePair: () => {},
});

export function usePrices() {
  return useContext(PriceContext);
}

const THROTTLE_MS = 1000;

export function PriceProvider({
  openPairs,
  decimalsMap,
  children,
}: {
  openPairs: string[];
  decimalsMap: Record<string, number>;
  children: ReactNode;
}) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const pricesRef = useRef<Record<string, PriceData>>({});
  const clientRef = useRef<SimpleFXClient | null>(null);
  const prevPairsRef = useRef<string[]>([]);
  const clientPairsRef = useRef<Set<string>>(new Set());

  // Initialize client once
  useEffect(() => {
    const client = new SimpleFXClient({
      onQuote: (quote: SimpleFXQuote) => {
        pricesRef.current[quote.s] = {
          bid: quote.b,
          ask: quote.a,
          timestamp: quote.t,
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
  }, []);

  // Client-side pair subscription (for immediate updates without server refresh)
  const subscribePair = useCallback((pair: string) => {
    const client = clientRef.current;
    if (!client || clientPairsRef.current.has(pair)) return;

    clientPairsRef.current.add(pair);

    // Ensure connected
    if (status === "disconnected") {
      client.connect();
    }
    client.subscribe([pair]);
  }, [status]);

  // Manage subscriptions when openPairs changes (server-side refresh)
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Merge server pairs + client pairs
    const allPairs = [...new Set([...openPairs, ...clientPairsRef.current])];
    const prev = new Set(prevPairsRef.current);
    const next = new Set(allPairs);

    const toAdd = allPairs.filter((p) => !prev.has(p));
    const toRemove = prevPairsRef.current.filter((p) => !next.has(p));

    if (allPairs.length > 0 && prevPairsRef.current.length === 0) {
      client.connect();
    }

    if (toAdd.length > 0) {
      client.subscribe(toAdd);
    }

    if (toRemove.length > 0) {
      client.unsubscribe(toRemove);
    }

    if (allPairs.length === 0 && prevPairsRef.current.length > 0) {
      client.disconnect();
      pricesRef.current = {};
      setPrices({});
    }

    prevPairsRef.current = allPairs;

    // Sync client pairs with server — remove client pairs now in server list
    for (const p of openPairs) {
      clientPairsRef.current.delete(p);
    }
  }, [openPairs]);

  return (
    <PriceContext.Provider value={{ prices, status, decimalsMap, subscribePair }}>
      {children}
    </PriceContext.Provider>
  );
}
