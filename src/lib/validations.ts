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

// ── Strategies ───────────────────────────────────────────────────
const strategyFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  type: z.enum(["checkbox", "range", "text", "select"]),
  order: z.number().int().min(0),
  options: z.array(z.string().max(100)).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  fields: z.array(strategyFieldSchema).min(1, "Debe tener al menos un campo"),
});

export const updateStrategySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  fields: z.array(strategyFieldSchema).min(1).optional(),
});

export const saveChecklistSchema = z.object({
  tradeId: cuid,
  strategyId: cuid,
  values: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
});
