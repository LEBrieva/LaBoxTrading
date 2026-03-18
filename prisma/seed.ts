import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Broker = "SIMPLEFX" | "BITGET";

interface SymbolEntry {
  name: string;
  broker: Broker;
  category: string;
  decimals: number;
}

// ── SimpleFX symbols ──────────────────────────────────────────────
const simplefxSymbols: SymbolEntry[] = [
  // Indices
  { name: "US100", broker: "SIMPLEFX", category: "indices", decimals: 2 },
  { name: "US500", broker: "SIMPLEFX", category: "indices", decimals: 2 },
  { name: "US30", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "US2000", broker: "SIMPLEFX", category: "indices", decimals: 1 },
  { name: "DE40", broker: "SIMPLEFX", category: "indices", decimals: 1 },
  { name: "FR40", broker: "SIMPLEFX", category: "indices", decimals: 1 },
  { name: "UK100", broker: "SIMPLEFX", category: "indices", decimals: 1 },
  { name: "EU50", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "CH20", broker: "SIMPLEFX", category: "indices", decimals: 1 },
  { name: "JP225", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "HK50", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "AU200", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "ES35", broker: "SIMPLEFX", category: "indices", decimals: 0 },
  { name: "VIX", broker: "SIMPLEFX", category: "indices", decimals: 2 },

  // Forex majors
  { name: "EURUSD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "GBPUSD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDJPY", broker: "SIMPLEFX", category: "forex", decimals: 3 },
  { name: "USDCAD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "AUDUSD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "NZDUSD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDCHF", broker: "SIMPLEFX", category: "forex", decimals: 5 },

  // Forex minors
  { name: "EURGBP", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "EURJPY", broker: "SIMPLEFX", category: "forex", decimals: 3 },
  { name: "EURCHF", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "GBPJPY", broker: "SIMPLEFX", category: "forex", decimals: 3 },
  { name: "AUDCAD", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "AUDCHF", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "AUDJPY", broker: "SIMPLEFX", category: "forex", decimals: 3 },
  { name: "CADCHF", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "NZDJPY", broker: "SIMPLEFX", category: "forex", decimals: 3 },

  // Forex exotic
  { name: "USDMXN", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDTRY", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDZAR", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDPLN", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDNOK", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDCNH", broker: "SIMPLEFX", category: "forex", decimals: 5 },
  { name: "USDKRW", broker: "SIMPLEFX", category: "forex", decimals: 2 },

  // Dollar Index
  { name: "USDINDEX", broker: "SIMPLEFX", category: "forex", decimals: 3 },

  // Metals
  { name: "XAUUSD", broker: "SIMPLEFX", category: "metals", decimals: 2 },
  { name: "XAGUSD", broker: "SIMPLEFX", category: "metals", decimals: 4 },
  { name: "COPPER", broker: "SIMPLEFX", category: "metals", decimals: 4 },
  { name: "PALL", broker: "SIMPLEFX", category: "metals", decimals: 1 },
  { name: "PLAT", broker: "SIMPLEFX", category: "metals", decimals: 1 },

  // Energy
  { name: "OIL", broker: "SIMPLEFX", category: "energy", decimals: 3 },
  { name: "BRENT", broker: "SIMPLEFX", category: "energy", decimals: 3 },
  { name: "NATGAS", broker: "SIMPLEFX", category: "energy", decimals: 3 },

  // Agriculture
  { name: "COCOA", broker: "SIMPLEFX", category: "commodities", decimals: 0 },
  { name: "COFFEE", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "CORN", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "COTTON", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "SOYBEAN", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "SUGAR", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "WHEAT", broker: "SIMPLEFX", category: "commodities", decimals: 2 },
  { name: "SOYOIL", broker: "SIMPLEFX", category: "commodities", decimals: 2 },

  // Crypto
  { name: "BTCUSD", broker: "SIMPLEFX", category: "crypto", decimals: 2 },
  { name: "ETHUSD", broker: "SIMPLEFX", category: "crypto", decimals: 2 },
  { name: "SOLUSD", broker: "SIMPLEFX", category: "crypto", decimals: 2 },
  { name: "XRPUSD", broker: "SIMPLEFX", category: "crypto", decimals: 4 },
  { name: "BNBUSD", broker: "SIMPLEFX", category: "crypto", decimals: 2 },
  { name: "ADAUSD", broker: "SIMPLEFX", category: "crypto", decimals: 4 },
  { name: "DOTUSD", broker: "SIMPLEFX", category: "crypto", decimals: 3 },
  { name: "LINKUSD", broker: "SIMPLEFX", category: "crypto", decimals: 3 },
  { name: "LTCUSD", broker: "SIMPLEFX", category: "crypto", decimals: 2 },

  // Bonds
  { name: "BUND", broker: "SIMPLEFX", category: "bonds", decimals: 2 },
  { name: "GILT", broker: "SIMPLEFX", category: "bonds", decimals: 2 },
  { name: "TNOTE", broker: "SIMPLEFX", category: "bonds", decimals: 6 },
];

// ── Bitget symbols (crypto spot USDT pairs) ───────────────────────
const bitgetSymbols: SymbolEntry[] = [
  // Major
  { name: "BTCUSDT", broker: "BITGET", category: "crypto", decimals: 2 },
  { name: "ETHUSDT", broker: "BITGET", category: "crypto", decimals: 2 },
  { name: "SOLUSDT", broker: "BITGET", category: "crypto", decimals: 2 },
  { name: "XRPUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "BNBUSDT", broker: "BITGET", category: "crypto", decimals: 1 },
  { name: "ADAUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "DOTUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "LINKUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "LTCUSDT", broker: "BITGET", category: "crypto", decimals: 2 },

  // Popular alts
  { name: "DOGEUSDT", broker: "BITGET", category: "crypto", decimals: 5 },
  { name: "AVAXUSDT", broker: "BITGET", category: "crypto", decimals: 2 },
  { name: "SHIBUSDT", broker: "BITGET", category: "crypto", decimals: 9 },
  { name: "UNIUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "ATOMUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "FILUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "APTUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "ARBUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "OPUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "SUIUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "NEARUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "AAVEUSDT", broker: "BITGET", category: "crypto", decimals: 2 },
  { name: "RENDERUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "FETUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "INJUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
  { name: "TIAUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "SEIUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "PEPEUSDT", broker: "BITGET", category: "crypto", decimals: 9 },
  { name: "WIFUSDT", broker: "BITGET", category: "crypto", decimals: 4 },

  // Stablecoins / DeFi
  { name: "MATICUSDT", broker: "BITGET", category: "crypto", decimals: 4 },
  { name: "TRXUSDT", broker: "BITGET", category: "crypto", decimals: 5 },
  { name: "TONUSDT", broker: "BITGET", category: "crypto", decimals: 3 },
];

const allSymbols = [...simplefxSymbols, ...bitgetSymbols];

async function main() {
  console.log(`Seeding ${allSymbols.length} symbols (${simplefxSymbols.length} SimpleFX + ${bitgetSymbols.length} Bitget)...`);

  for (const symbol of allSymbols) {
    await prisma.symbol.upsert({
      where: { name_broker: { name: symbol.name, broker: symbol.broker } },
      update: { category: symbol.category, decimals: symbol.decimals },
      create: symbol,
    });
  }

  console.log(`✓ ${allSymbols.length} symbols seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
