export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface PriceQuote {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface PriceClientOptions {
  onQuote: (quote: PriceQuote) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export interface PriceClient {
  connect(): void;
  disconnect(): void;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
}
