import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const symbols = [
  // Indices
  { name: "US100", category: "indices", decimals: 2 },
  { name: "US500", category: "indices", decimals: 2 },
  { name: "US30", category: "indices", decimals: 0 },
  { name: "US2000", category: "indices", decimals: 1 },
  { name: "DE40", category: "indices", decimals: 1 },
  { name: "FR40", category: "indices", decimals: 1 },
  { name: "UK100", category: "indices", decimals: 1 },
  { name: "EU50", category: "indices", decimals: 0 },
  { name: "CH20", category: "indices", decimals: 1 },
  { name: "JP225", category: "indices", decimals: 0 },
  { name: "HK50", category: "indices", decimals: 0 },
  { name: "AU200", category: "indices", decimals: 0 },
  { name: "ES35", category: "indices", decimals: 0 },
  { name: "VIX", category: "indices", decimals: 2 },

  // Forex majors
  { name: "EURUSD", category: "forex", decimals: 5 },
  { name: "GBPUSD", category: "forex", decimals: 5 },
  { name: "USDJPY", category: "forex", decimals: 3 },
  { name: "USDCAD", category: "forex", decimals: 5 },
  { name: "AUDUSD", category: "forex", decimals: 5 },
  { name: "NZDUSD", category: "forex", decimals: 5 },
  { name: "USDCHF", category: "forex", decimals: 5 },

  // Forex minors
  { name: "EURGBP", category: "forex", decimals: 5 },
  { name: "EURJPY", category: "forex", decimals: 3 },
  { name: "EURCHF", category: "forex", decimals: 5 },
  { name: "GBPJPY", category: "forex", decimals: 3 },
  { name: "AUDCAD", category: "forex", decimals: 5 },
  { name: "AUDCHF", category: "forex", decimals: 5 },
  { name: "AUDJPY", category: "forex", decimals: 3 },
  { name: "CADCHF", category: "forex", decimals: 5 },
  { name: "NZDJPY", category: "forex", decimals: 3 },

  // Forex exotic
  { name: "USDMXN", category: "forex", decimals: 5 },
  { name: "USDTRY", category: "forex", decimals: 5 },
  { name: "USDZAR", category: "forex", decimals: 5 },
  { name: "USDPLN", category: "forex", decimals: 5 },
  { name: "USDNOK", category: "forex", decimals: 5 },
  { name: "USDCNH", category: "forex", decimals: 5 },
  { name: "USDKRW", category: "forex", decimals: 2 },

  // Dollar Index
  { name: "USDINDEX", category: "forex", decimals: 3 },

  // Metals
  { name: "XAUUSD", category: "metals", decimals: 2 },
  { name: "XAGUSD", category: "metals", decimals: 4 },
  { name: "COPPER", category: "metals", decimals: 4 },
  { name: "PALL", category: "metals", decimals: 1 },
  { name: "PLAT", category: "metals", decimals: 1 },

  // Energy
  { name: "OIL", category: "energy", decimals: 3 },
  { name: "BRENT", category: "energy", decimals: 3 },
  { name: "NATGAS", category: "energy", decimals: 3 },

  // Agriculture
  { name: "COCOA", category: "commodities", decimals: 0 },
  { name: "COFFEE", category: "commodities", decimals: 2 },
  { name: "CORN", category: "commodities", decimals: 2 },
  { name: "COTTON", category: "commodities", decimals: 2 },
  { name: "SOYBEAN", category: "commodities", decimals: 2 },
  { name: "SUGAR", category: "commodities", decimals: 2 },
  { name: "WHEAT", category: "commodities", decimals: 2 },
  { name: "SOYOIL", category: "commodities", decimals: 2 },

  // Crypto
  { name: "BTCUSD", category: "crypto", decimals: 2 },
  { name: "ETHUSD", category: "crypto", decimals: 2 },
  { name: "SOLUSD", category: "crypto", decimals: 2 },
  { name: "XRPUSD", category: "crypto", decimals: 4 },
  { name: "BNBUSD", category: "crypto", decimals: 2 },
  { name: "ADAUSD", category: "crypto", decimals: 4 },
  { name: "DOTUSD", category: "crypto", decimals: 3 },
  { name: "LINKUSD", category: "crypto", decimals: 3 },
  { name: "LTCUSD", category: "crypto", decimals: 2 },

  // Bonds
  { name: "BUND", category: "bonds", decimals: 2 },
  { name: "GILT", category: "bonds", decimals: 2 },
  { name: "TNOTE", category: "bonds", decimals: 6 },
];

async function main() {
  console.log(`Seeding ${symbols.length} symbols...`);

  for (const symbol of symbols) {
    await prisma.symbol.upsert({
      where: { name: symbol.name },
      update: { category: symbol.category, decimals: symbol.decimals },
      create: symbol,
    });
  }

  console.log(`✓ ${symbols.length} symbols seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
