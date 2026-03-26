"use client";

import { useRef, useEffect, useState } from "react";
import type { Candle } from "@/lib/actions/candles";

export interface TradeChartProps {
  candles: Candle[];
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  direction: "LONG" | "SHORT";
  isOpen: boolean;
  decimals?: number;
  livePrice?: number | null;
  period: number;
  revertKey?: number;
  onDragEnd?: (type: "sl" | "tp", price: number) => void;
}

export default function TradeChart({
  candles,
  entry,
  stopLoss,
  takeProfit,
  isOpen,
  decimals = 2,
  livePrice,
  period,
  revertKey,
  onDragEnd,
}: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slLineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tpLineRef = useRef<any>(null);
  const lastCandleRef = useRef<Candle | null>(null);
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const draggingRef = useRef<"sl" | "tp" | null>(null);
  const dragStartPriceRef = useRef(0);
  const dragStartYRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineStyleRef = useRef<any>(null);

  const [ready, setReady] = useState(false);

  // Initialize chart — runs once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cleanupFn: (() => void) | null = null;

    (async () => {
      const { createChart, CandlestickSeries, ColorType, LineStyle, CrosshairMode } =
        await import("lightweight-charts");

      if (cancelled || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#71717a",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "#1a1d2720" },
          horzLines: { color: "#1a1d2720" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#5eead440", labelBackgroundColor: "#1a1d27" },
          horzLine: { color: "#5eead440", labelBackgroundColor: "#1a1d27" },
        },
        rightPriceScale: {
          borderColor: "#252833",
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: "#252833",
          timeVisible: true,
          secondsVisible: false,
        },
        localization: {
          timeFormatter: (time: number) =>
            new Date(time * 1000).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }),
        },
        handleScroll: { vertTouchDrag: false },
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#4ade80",
        downColor: "#f87171",
        borderUpColor: "#4ade80",
        borderDownColor: "#f87171",
        wickUpColor: "#4ade8080",
        wickDownColor: "#f8717180",
      });

      chartRef.current = chart;
      seriesRef.current = series;
      lineStyleRef.current = LineStyle;

      // Resize observer
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        chart.resize(width, height);
      });
      ro.observe(containerRef.current!);

      // Drag handler for SL/TP
      const el = containerRef.current!;

      const getPrice = (y: number): number => {
        const coord = series.coordinateToPrice(y) as number;
        return Math.round(coord * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };

      const hitTest = (y: number): "sl" | "tp" | null => {
        if (slLineRef.current) {
          const slY = series.priceToCoordinate(slLineRef.current.options().price);
          if (slY != null && Math.abs(y - (slY as number)) < 8) return "sl";
        }
        if (tpLineRef.current) {
          const tpY = series.priceToCoordinate(tpLineRef.current.options().price);
          if (tpY != null && Math.abs(y - (tpY as number)) < 8) return "tp";
        }
        return null;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (!isOpen) return;
        const rect = el.getBoundingClientRect();
        const hit = hitTest(e.clientY - rect.top);
        if (!hit) return;
        draggingRef.current = hit;
        dragStartYRef.current = e.clientY;
        const line = hit === "sl" ? slLineRef.current : tpLineRef.current;
        dragStartPriceRef.current = line?.options().price ?? 0;
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!draggingRef.current) {
          if (!isOpen) return;
          const rect = el.getBoundingClientRect();
          el.style.cursor = hitTest(e.clientY - rect.top) ? "ns-resize" : "";
          return;
        }
        if (Math.abs(e.clientY - dragStartYRef.current) < 4) return;
        const rect = el.getBoundingClientRect();
        const newPrice = getPrice(e.clientY - rect.top);
        const line = draggingRef.current === "sl" ? slLineRef.current : tpLineRef.current;
        if (line && newPrice > 0) line.applyOptions({ price: newPrice });
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!draggingRef.current) return;
        const type = draggingRef.current;
        draggingRef.current = null;
        el.style.cursor = "";
        el.releasePointerCapture(e.pointerId);
        const line = type === "sl" ? slLineRef.current : tpLineRef.current;
        if (!line) return;
        const finalPrice = line.options().price;
        if (finalPrice !== dragStartPriceRef.current) {
          onDragEndRef.current?.(type, finalPrice);
        }
      };

      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerUp);

      cleanupFn = () => {
        ro.disconnect();
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerUp);
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };

      // Signal ready — triggers data load via the candles effect
      setReady(true);
    })();

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryLineRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // Initial data load — runs once when chart is ready and candles are available
  useEffect(() => {
    if (!ready || !seriesRef.current || candles.length === 0 || !lineStyleRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const LineStyle = lineStyleRef.current;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seriesRef.current.setData(candles as any);
    lastCandleRef.current = candles[candles.length - 1];

    const lineBase = { lineWidth: 1 as const, axisLabelVisible: true };

    if (entry != null) {
      entryLineRef.current = seriesRef.current.createPriceLine({
        ...lineBase,
        price: entry,
        color: "#d4d4d8",
        lineStyle: LineStyle.Dashed,
        title: "Entry",
      });
    }

    if (stopLoss != null) {
      slLineRef.current = seriesRef.current.createPriceLine({
        ...lineBase,
        price: stopLoss,
        color: "#f87171",
        lineStyle: LineStyle.Dotted,
        title: "SL",
      });
    }

    if (takeProfit != null) {
      tpLineRef.current = seriesRef.current.createPriceLine({
        ...lineBase,
        price: takeProfit,
        color: "#4ade80",
        lineStyle: LineStyle.Dotted,
        title: "TP",
      });
    }

    chartRef.current?.timeScale().fitContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, candles.length > 0]); // re-check when candles become available

  // Poll merge — update candle data without resetting zoom or price lines
  useEffect(() => {
    if (!ready || !seriesRef.current || !initializedRef.current || candles.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seriesRef.current.setData(candles as any);
    lastCandleRef.current = candles[candles.length - 1];
    // No fitContent — preserve user's zoom/scroll position
  }, [ready, candles]);

  // Revert SL/TP lines to original values (cancel drag or external update)
  useEffect(() => {
    if (slLineRef.current && stopLoss != null) {
      slLineRef.current.applyOptions({ price: stopLoss });
    }
    if (tpLineRef.current && takeProfit != null) {
      tpLineRef.current.applyOptions({ price: takeProfit });
    }
  }, [stopLoss, takeProfit, revertKey]);

  // Live price tick → update last candle
  useEffect(() => {
    if (!ready || !seriesRef.current || !livePrice || candles.length === 0) return;

    const last = lastCandleRef.current ?? candles[candles.length - 1];
    if (!last) return;

    const now = Math.floor(Date.now() / 1000);

    if (now >= last.time + period) {
      const newCandle: Candle = {
        time: last.time + period,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
      };
      lastCandleRef.current = newCandle;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.update(newCandle as any);
    } else {
      const updated: Candle = {
        ...last,
        close: livePrice,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
      };
      lastCandleRef.current = updated;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.update(updated as any);
    }
  }, [ready, livePrice, period, candles]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
}
