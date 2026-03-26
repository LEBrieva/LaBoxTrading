"use server";

import { getUser } from "./auth";
import { checkRateLimit } from "@/lib/rate-limit";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SimpleFXCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  size: number;
}

export async function getCandles(
  symbol: string,
  cPeriod: number,
  timeFrom?: number,
  timeTo?: number
): Promise<Candle[]> {
  const user = await getUser();
  checkRateLimit(user.id, "getCandles", 20, 60_000);

  const params = new URLSearchParams({
    symbol,
    cPeriod: String(cPeriod),
  });
  if (timeFrom) params.set("timeFrom", String(timeFrom));
  if (timeTo) params.set("timeTo", String(timeTo));

  const res = await fetch(
    `https://candles-core.simplefx.com/api/v3/candles?${params}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Error al obtener velas: ${res.status}`);
  }

  const json = await res.json();
  const data: SimpleFXCandle[] = json.data ?? [];

  return data.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}
