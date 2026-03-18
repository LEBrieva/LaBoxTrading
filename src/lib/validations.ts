import { z } from "zod/v4";

// ── Shared ────────────────────────────────────────────────────────
const cuid = z.string().min(1);
const optionalNumber = z.number().optional();
const optionalString = z.string().max(2000).optional();
const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Fecha inválida" }).optional();

// ── Accounts ──────────────────────────────────────────────────────
export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  broker: z.enum(["SIMPLEFX", "BITGET"]),
  initialCapital: z.number().positive(),
  targetCapital: z.number().positive(),
  currency: z.string().max(10).optional(),
  walletAddress: z.string().max(200).optional(),
  walletNetwork: z.string().max(20).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  broker: z.enum(["SIMPLEFX", "BITGET"]).optional(),
  targetCapital: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  walletAddress: z.string().max(200).nullable().optional(),
  walletNetwork: z.string().max(20).nullable().optional(),
});

// ── Trades ────────────────────────────────────────────────────────
export const createTradeSchema = z.object({
  accountId: cuid,
  pair: z.string().min(1).max(20),
  direction: z.enum(["LONG", "SHORT"]),
  entry: optionalNumber,
  stopLoss: optionalNumber,
  takeProfit: optionalNumber,
  size: z.number().positive().optional(),
  riskUsd: z.number().min(0),
  riskPct: z.number().min(0).max(100),
  externalId: optionalString,
  notes: z.string().max(5000).optional(),
  imageUrl: z.url().optional(),
  openedAt: dateString,
});

export const updateTradeSchema = z.object({
  entry: z.number().nullable().optional(),
  stopLoss: z.number().nullable().optional(),
  takeProfit: z.number().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  externalId: z.string().max(200).nullable().optional(),
  openedAt: dateString,
});

export const closePositionSchema = z.object({
  positionId: cuid,
  result: z.enum(["TP", "SL", "BE", "PARTIAL"]),
  pnl: z.number(),
  partialPct: z.number().min(0).max(100).optional(),
  closedAt: dateString,
  closePrice: z.number().optional(),
});

// ── Trade Images ──────────────────────────────────────────────────
export const addTradeImageSchema = z.object({
  tradeId: cuid,
  url: z.url(),
  caption: z.string().max(500).optional(),
});
