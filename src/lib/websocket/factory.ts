import type { PriceClient, PriceClientOptions } from "./types";
import { SimpleFXClient } from "./simplefx-client";
import { BitgetClient } from "./bitget-client";

export function createPriceClient(broker: string, options: PriceClientOptions): PriceClient {
  switch (broker) {
    case "BITGET":
      return new BitgetClient(options);
    case "SIMPLEFX":
    default:
      return new SimpleFXClient(options);
  }
}
