const CRYPTO_BASES = ["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOT", "LINK", "LTC"];

/**
 * Translate app symbol (SimpleFX naming) to broker's WS symbol.
 * e.g. "BTCUSD" + "BITGET" → "BTCUSDT"
 */
export function toWsSymbol(appSymbol: string, broker: string): string {
  if (broker === "BITGET") {
    const base = CRYPTO_BASES.find((c) => appSymbol === `${c}USD`);
    if (base) return `${base}USDT`;
  }
  return appSymbol;
}

/**
 * Translate broker's WS symbol back to app symbol.
 * e.g. "BTCUSDT" + "BITGET" → "BTCUSD"
 */
export function fromWsSymbol(wsSymbol: string, broker: string): string {
  if (broker === "BITGET") {
    const base = CRYPTO_BASES.find((c) => wsSymbol === `${c}USDT`);
    if (base) return `${base}USD`;
  }
  return wsSymbol;
}

/**
 * Check if a symbol is available on the given broker's WS.
 * Bitget only has crypto spot pairs.
 */
export function isSymbolSupported(appSymbol: string, broker: string): boolean {
  if (broker === "SIMPLEFX") return true;
  if (broker === "BITGET") {
    return CRYPTO_BASES.some((c) => appSymbol === `${c}USD`);
  }
  return false;
}
