export function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function calcRiskUsd(capital: number, riskPct: number): number {
  return capital * (riskPct / 100);
}

export function calcRiskPct(capital: number, riskUsd: number): number {
  if (capital === 0) return 0;
  return (riskUsd / capital) * 100;
}

export function calcTpPrice(
  entry: number,
  stopLoss: number,
  ratio: number,
  direction: "LONG" | "SHORT"
): number {
  const distance = Math.abs(entry - stopLoss);
  return direction === "LONG" ? entry + distance * ratio : entry - distance * ratio;
}

export function calcEstimatedGain(riskUsd: number, ratio: number): number {
  return riskUsd * ratio;
}

export function calcWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function calcPnlPct(pnl: number, capital: number): number {
  if (capital === 0) return 0;
  return (pnl / capital) * 100;
}

export function calcProgressPct(current: number, initial: number, target: number): number {
  const range = target - initial;
  if (range === 0) return 0;
  return Math.min(((current - initial) / range) * 100, 100);
}

export function calcUnrealizedPnl(
  entry: number,
  currentPrice: number,
  size: number,
  direction: "LONG" | "SHORT"
): number {
  return direction === "LONG"
    ? (currentPrice - entry) * size
    : (entry - currentPrice) * size;
}
