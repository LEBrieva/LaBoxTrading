const EXPECTED_HEADERS = [
  "Símbolo",
  "ID de la orden",
  "Lado",
  "Tamaño",
  "Hora de Apertura",
  "Hora de Cierre",
  "Precio de Apertura",
  "Precio de cierre",
  "Take Profit",
  "Stop Loss",
  "Comentario",
  "Ganancia (USDT)",
];

const LIMIT_SIDES = new Set(["BUY LIMIT", "SELL LIMIT"]);
const VALID_SIDES = new Set(["BUY", "SELL", "BUY LIMIT", "SELL LIMIT"]);

export interface ParsedRow {
  symbol: string;
  externalId: string;
  direction: "LONG" | "SHORT";
  size: number;
  openedAt: Date;
  closedAt: Date;
  entry: number;
  closePrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  notes: string | null;
  pnl: number;
  positionStatus: "TP" | "SL" | "BE";
}

export interface ParseResult {
  rows: ParsedRow[];
  pending: number;
  errors: { line: number; reason: string }[];
}

function parseDate(str: string): Date | null {
  // DD.MM.YYYY HH:MM:SS
  const match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, mi, ss] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(mi),
    Number(ss)
  );
  if (isNaN(date.getTime())) return null;
  return date;
}

function parseOptionalNumber(val: string): number | null {
  if (!val.trim()) return null;
  const n = Number(val);
  if (isNaN(n) || n < 0) return null;
  return n;
}

export function parseSimplefxCsv(csvText: string): ParseResult {
  // BOM removal + normalize line endings
  const clean = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    return { rows: [], pending: 0, errors: [{ line: 1, reason: "CSV vacio o sin datos" }] };
  }

  // Validate headers
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim());
  const expectedJoined = EXPECTED_HEADERS.join(",");
  const actualJoined = headers.slice(0, EXPECTED_HEADERS.length).join(",");

  if (actualJoined !== expectedJoined) {
    return {
      rows: [],
      pending: 0,
      errors: [{ line: 1, reason: "Headers no coinciden con el formato de SimpleFX" }],
    };
  }

  const rows: ParsedRow[] = [];
  const errors: { line: number; reason: string }[] = [];
  const seenIds = new Set<string>();
  let pending = 0;

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const parts = lines[i].split(",");

    if (parts.length < 12) {
      errors.push({ line: lineNum, reason: "Columnas insuficientes" });
      continue;
    }

    const side = parts[2].trim().toUpperCase();

    // Skip LIMIT orders immediately — no further validation
    if (LIMIT_SIDES.has(side)) {
      pending++;
      continue;
    }

    // Skip pending orders with "-" open time
    const openTimeRaw = parts[4].trim();
    if (openTimeRaw === "-") {
      pending++;
      continue;
    }

    // Validate side
    if (!VALID_SIDES.has(side)) {
      errors.push({ line: lineNum, reason: `Lado invalido: "${parts[2].trim()}"` });
      continue;
    }

    // Parse and validate fields
    const symbol = parts[0].trim();
    if (!symbol) {
      errors.push({ line: lineNum, reason: "Simbolo vacio" });
      continue;
    }

    const externalId = parts[1].trim();
    if (!externalId || !/^\d+$/.test(externalId)) {
      errors.push({ line: lineNum, reason: `ID de orden invalido: "${parts[1].trim()}"` });
      continue;
    }

    // Dedup within CSV
    if (seenIds.has(externalId)) {
      errors.push({ line: lineNum, reason: `ID duplicado en CSV: ${externalId}` });
      continue;
    }
    seenIds.add(externalId);

    const size = Number(parts[3].trim());
    if (isNaN(size) || size <= 0) {
      errors.push({ line: lineNum, reason: `Tamano invalido: "${parts[3].trim()}"` });
      continue;
    }

    const openedAt = parseDate(openTimeRaw);
    if (!openedAt) {
      errors.push({ line: lineNum, reason: `Hora de apertura invalida: "${openTimeRaw}"` });
      continue;
    }

    const closeTimeRaw = parts[5].trim();
    const closedAt = parseDate(closeTimeRaw);
    if (!closedAt) {
      errors.push({ line: lineNum, reason: `Hora de cierre invalida: "${closeTimeRaw}"` });
      continue;
    }

    const entry = Number(parts[6].trim());
    if (isNaN(entry) || entry <= 0) {
      errors.push({ line: lineNum, reason: `Precio de apertura invalido: "${parts[6].trim()}"` });
      continue;
    }

    const closePrice = Number(parts[7].trim());
    if (isNaN(closePrice) || closePrice <= 0) {
      errors.push({ line: lineNum, reason: `Precio de cierre invalido: "${parts[7].trim()}"` });
      continue;
    }

    const takeProfit = parseOptionalNumber(parts[8].trim());
    const stopLoss = parseOptionalNumber(parts[9].trim());

    // Handle comment — if >12 columns, rejoin extras
    const comment = parts.length > 12
      ? parts.slice(10, -1).join(",").trim()
      : parts[10].trim();
    const notes = comment || null;

    const pnlRaw = parts[parts.length - 1].trim();
    const pnl = Number(pnlRaw);
    if (isNaN(pnl)) {
      errors.push({ line: lineNum, reason: `Ganancia invalida: "${pnlRaw}"` });
      continue;
    }

    const direction: "LONG" | "SHORT" = side === "BUY" ? "LONG" : "SHORT";
    const positionStatus: "TP" | "SL" | "BE" = pnl > 0 ? "TP" : pnl < 0 ? "SL" : "BE";

    rows.push({
      symbol,
      externalId,
      direction,
      size,
      openedAt,
      closedAt,
      entry,
      closePrice,
      takeProfit,
      stopLoss,
      notes,
      pnl,
      positionStatus,
    });
  }

  return { rows, pending, errors };
}
