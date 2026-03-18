import type { PriceClient, PriceClientOptions } from "./types";

const WS_URL = "wss://ws.bitget.com/v2/ws/public";
const PING_INTERVAL = 30_000;
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;

export class BitgetClient implements PriceClient {
  private ws: WebSocket | null = null;
  private options: PriceClientOptions;
  private activeSymbols = new Set<string>();
  private backoff = INITIAL_BACKOFF;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;

  constructor(options: PriceClientOptions) {
    this.options = options;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this.options.onStatusChange("connecting");

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.backoff = INITIAL_BACKOFF;
      this.options.onStatusChange("connected");

      this.startPing();

      if (this.activeSymbols.size > 0) {
        this.sendSubscribe([...this.activeSymbols]);
      }
    };

    this.ws.onmessage = (event) => {
      const raw = event.data as string;

      // Bitget replies "pong" to our "ping"
      if (raw === "pong") return;

      try {
        const msg = JSON.parse(raw);

        // Ticker snapshot/update
        if (msg.arg?.channel === "ticker" && Array.isArray(msg.data)) {
          for (const d of msg.data) {
            this.options.onQuote({
              symbol: d.instId || msg.arg.instId,
              bid: parseFloat(d.bidPr),
              ask: parseFloat(d.askPr),
              timestamp: parseInt(d.ts, 10),
            });
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.stopPing();
      if (!this.intentionalClose) {
        this.options.onStatusChange("reconnecting");
        this.scheduleReconnect();
      } else {
        this.options.onStatusChange("disconnected");
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.activeSymbols.clear();
    this.options.onStatusChange("disconnected");
  }

  subscribe(symbols: string[]) {
    const newSymbols = symbols.filter((s) => !this.activeSymbols.has(s));
    if (newSymbols.length === 0) return;

    for (const s of newSymbols) {
      this.activeSymbols.add(s);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(newSymbols);
    }
  }

  unsubscribe(symbols: string[]) {
    const toRemove = symbols.filter((s) => this.activeSymbols.has(s));
    if (toRemove.length === 0) return;

    for (const s of toRemove) {
      this.activeSymbols.delete(s);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          op: "unsubscribe",
          args: toRemove.map((instId) => ({
            instType: "SPOT",
            channel: "ticker",
            instId,
          })),
        })
      );
    }
  }

  private sendSubscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          op: "subscribe",
          args: symbols.map((instId) => ({
            instType: "SPOT",
            channel: "ticker",
            instId,
          })),
        })
      );
    }
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, PING_INTERVAL);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
      this.connect();
    }, this.backoff);
  }
}
