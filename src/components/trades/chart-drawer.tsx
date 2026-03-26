"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePrices } from "@/contexts/price-context";
import { getCandles } from "@/lib/actions/candles";
import { updateTrade } from "@/lib/actions/trades";
import { useToast } from "@/components/ui/toast";
import type { Candle } from "@/lib/actions/candles";

const TradeChart = dynamic(() => import("@/components/charts/trade-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-6 h-6 border-2 border-[#252833] border-t-[#5eead4] rounded-full animate-spin" />
    </div>
  ),
});

interface Trade {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  size: number | null;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
}

interface ChartDrawerProps {
  trade: Trade;
  preloadedCandles: Candle[] | null;
  decimals?: number;
  onTradeUpdated?: (tradeId: string, updates: Partial<Trade>) => void;
  onClose: () => void;
}

const TIMEFRAMES = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1h", value: 3600 },
  { label: "4h", value: 14400 },
  { label: "1D", value: 86400 },
] as const;

const DEFAULT_PERIOD = 300; // 5m

export function ChartDrawer({
  trade,
  preloadedCandles,
  decimals = 2,
  onTradeUpdated,
  onClose,
}: ChartDrawerProps) {
  const [candles, setCandles] = useState<Candle[]>(preloadedCandles ?? []);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [loading, setLoading] = useState(!preloadedCandles);
  const [error, setError] = useState<string | null>(null);
  const lastCandleTimeRef = useRef<number>(0);
  const { prices, subscribePair } = usePrices();
  const { show: toast } = useToast();
  const isOpen = trade.status === "OPEN";
  const periodRef = useRef(DEFAULT_PERIOD);

  // Live price for the chart
  const priceData = prices[trade.pair];
  const livePrice = priceData
    ? trade.direction === "LONG" ? priceData.bid : priceData.ask
    : null;

  // Track current SL/TP for drag revert
  const currentSlRef = useRef(trade.stopLoss);
  const currentTpRef = useRef(trade.takeProfit);
  useEffect(() => {
    currentSlRef.current = trade.stopLoss;
    currentTpRef.current = trade.takeProfit;
  }, [trade.stopLoss, trade.takeProfit]);

  // Fetch candles for a given period
  const fetchCandles = useCallback(
    async (cPeriod: number) => {
      setLoading(true);
      setError(null);
      try {
        let timeFrom: number | undefined;
        let timeTo: number | undefined;

        if (trade.status === "CLOSED" && trade.openedAt && trade.closedAt) {
          // For closed trades, show candles around trade's lifetime with padding
          const openTime = Math.floor(new Date(trade.openedAt).getTime() / 1000);
          const closeTime = Math.floor(new Date(trade.closedAt).getTime() / 1000);
          const padding = cPeriod * 20;
          timeFrom = openTime - padding;
          timeTo = closeTime + padding;
        }

        const data = await getCandles(trade.pair, cPeriod, timeFrom, timeTo);
        setCandles(data);
        if (data.length > 0) {
          lastCandleTimeRef.current = data[data.length - 1].time;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar velas");
      } finally {
        setLoading(false);
      }
    },
    [trade.pair, trade.status, trade.openedAt, trade.closedAt]
  );

  // Initial load — use preloaded if available and default period
  useEffect(() => {
    if (preloadedCandles && preloadedCandles.length > 0 && period === DEFAULT_PERIOD) {
      setCandles(preloadedCandles);
      lastCandleTimeRef.current = preloadedCandles[preloadedCandles.length - 1].time;
      setLoading(false);
    } else {
      fetchCandles(period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timeframe change
  function handlePeriodChange(newPeriod: number) {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    periodRef.current = newPeriod;
    fetchCandles(newPeriod);
  }

  // Subscribe to WebSocket for live ticks
  useEffect(() => {
    if (isOpen) subscribePair(trade.pair);
  }, [trade.pair, isOpen, subscribePair]);

  // Periodic poll — synced to candle close times (e.g. :00, :05, :10 for 5m)
  useEffect(() => {
    if (!isOpen || loading) return;

    const p = periodRef.current;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const fromTime = lastCandleTimeRef.current;
        if (!fromTime) return;
        const recent = await getCandles(trade.pair, p, fromTime);
        if (recent.length === 0) return;

        setCandles((prev) => {
          const map = new Map(prev.map((c) => [c.time, c]));
          for (const c of recent) {
            map.set(c.time, c);
          }
          const merged = Array.from(map.values()).sort((a, b) => a.time - b.time);
          lastCandleTimeRef.current = merged[merged.length - 1].time;
          return merged;
        });
      } catch {
        // Silent fail — polling is best-effort
      }
    };

    const scheduleNext = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      // Seconds until next candle boundary + 2s buffer for API to have the data
      const secsUntilNext = p - (nowSec % p) + 2;
      timer = setTimeout(() => {
        poll();
        scheduleNext();
      }, secsUntilNext * 1000);
    };

    scheduleNext();
    return () => clearTimeout(timer);
  }, [isOpen, loading, trade.pair, period]);

  // Drag confirmation state
  const [pendingDrag, setPendingDrag] = useState<{ type: "sl" | "tp"; price: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [revertKey, setRevertKey] = useState(0);

  function handleDragEnd(type: "sl" | "tp", price: number) {
    setPendingDrag({ type, price });
  }

  async function confirmDrag() {
    if (!pendingDrag) return;
    const { type, price } = pendingDrag;
    const prev = type === "sl" ? currentSlRef.current : currentTpRef.current;
    const updates = type === "sl" ? { stopLoss: price } : { takeProfit: price };

    setSaving(true);
    onTradeUpdated?.(trade.id, updates);

    try {
      await updateTrade(trade.id, updates);
      toast(
        `${type === "sl" ? "Stop Loss" : "Take Profit"} actualizado a ${price.toFixed(decimals)}`,
        "success"
      );
    } catch {
      const revert = type === "sl" ? { stopLoss: prev } : { takeProfit: prev };
      onTradeUpdated?.(trade.id, revert);
      toast("Error al actualizar. Se revirtió el cambio.", "error");
    } finally {
      setSaving(false);
      setPendingDrag(null);
    }
  }

  function cancelDrag() {
    if (!pendingDrag) return;
    // Increment revertKey to force chart lines back to original values
    setRevertKey((k) => k + 1);
    setPendingDrag(null);
  }

  return (
    <div
      className="fixed inset-0 md:inset-auto md:absolute md:top-0 md:bottom-0 md:right-[440px] md:w-[min(600px,calc(100vw-460px))] bg-[#08090c] border-r border-[#252833] z-[999] flex flex-col animate-in slide-in-from-left duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252833]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#d4d4d8]">{trade.pair}</span>
          <span className="text-[10px] text-[#52525b] font-mono">
            {TIMEFRAMES.find((t) => t.value === period)?.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#71717a] hover:text-[#d4d4d8] text-lg px-2 py-1 rounded hover:bg-[#1a1d27] transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#252833]">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => handlePeriodChange(tf.value)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
              period === tf.value
                ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/30"
                : "text-[#71717a] border border-transparent hover:text-[#d4d4d8] hover:bg-[#1a1d27]"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 p-2">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-2xl text-[#252833]">◈</span>
            <p className="text-[12px] text-[#f87171] tracking-[1px] font-mono">
              {error}
            </p>
            <button
              onClick={() => fetchCandles(period)}
              className="px-4 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[11px] font-semibold hover:text-[#5eead4] hover:border-[#5eead4]/30 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-2 border-[#252833] border-t-[#5eead4] rounded-full animate-spin" />
            <p className="text-[10px] text-[#52525b] tracking-[2px] uppercase font-mono animate-pulse">
              Cargando velas
            </p>
          </div>
        ) : (
          <TradeChart
            candles={candles}
            entry={trade.entry}
            stopLoss={trade.stopLoss}
            takeProfit={trade.takeProfit}
            direction={trade.direction}
            isOpen={isOpen}
            decimals={decimals}
            livePrice={isOpen ? livePrice : null}
            period={period}
            revertKey={revertKey}
            onDragEnd={isOpen ? handleDragEnd : undefined}
          />
        )}
      </div>

      {/* Drag hint for open trades */}
      {isOpen && !loading && !error && !pendingDrag && (trade.stopLoss != null || trade.takeProfit != null) && (
        <div className="px-4 py-2 border-t border-[#252833]">
          <p className="text-[9px] text-[#52525b] font-mono text-center">
            Arrastrá las líneas de SL/TP para modificar el trade
          </p>
        </div>
      )}

      {/* Drag confirmation popup */}
      {pendingDrag && (
        <div className="px-4 py-3 border-t border-[#252833] bg-[#0e1015] space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1.5px] rounded border"
              style={{
                color: pendingDrag.type === "sl" ? "#f87171" : "#4ade80",
                backgroundColor: pendingDrag.type === "sl" ? "#f8717115" : "#4ade8015",
                borderColor: pendingDrag.type === "sl" ? "#f8717140" : "#4ade8040",
              }}
            >
              {pendingDrag.type === "sl" ? "Stop Loss" : "Take Profit"}
            </span>
            <span className="text-[11px] text-[#71717a] font-mono">
              {(pendingDrag.type === "sl" ? trade.stopLoss : trade.takeProfit)?.toFixed(decimals) ?? "—"}
            </span>
            <span className="text-[11px] text-[#52525b]">→</span>
            <span className="text-[13px] text-[#d4d4d8] font-mono font-bold">
              {pendingDrag.price.toFixed(decimals)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancelDrag}
              disabled={saving}
              className="flex-1 py-2 rounded-lg border border-[#252833] text-[#71717a] text-[11px] font-semibold hover:border-[#2f3340] hover:text-[#d4d4d8] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDrag}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#5eead4] text-[#08090c] text-[11px] font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
