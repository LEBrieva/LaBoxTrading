export interface SimpleFXQuote {
  s: string;
  b: number;
  a: number;
  t: number;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

interface SimpleFXClientOptions {
  onQuote: (quote: SimpleFXQuote) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

const WS_URL = "wss://web-quotes-core.simplefx.com/websocket/quotes";
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;

export class SimpleFXClient {
  private ws: WebSocket | null = null;
  private options: SimpleFXClientOptions;
  private activeSymbols = new Set<string>();
  private messageId = 0;
  private backoff = INITIAL_BACKOFF;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(options: SimpleFXClientOptions) {
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

      // Re-subscribe to all active symbols on reconnect
      if (this.activeSymbols.size > 0) {
        this.sendSubscribe([...this.activeSymbols]);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.p === "/quotes/subscribed" && Array.isArray(msg.d)) {
          for (const quote of msg.d) {
            this.options.onQuote(quote);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.intentionalClose) {
        this.options.onStatusChange("reconnecting");
        this.scheduleReconnect();
      } else {
        this.options.onStatusChange("disconnected");
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, so reconnect is handled there
    };
  }

  disconnect() {
    this.intentionalClose = true;
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
        JSON.stringify({ p: "/subscribe/removeList", i: ++this.messageId, d: toRemove })
      );
    }
  }

  private sendSubscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({ p: "/subscribe/addList", i: ++this.messageId, d: symbols })
      );
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
