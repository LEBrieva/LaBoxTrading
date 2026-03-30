"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createAccountSchema, updateAccountSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod/v4";

export async function getAccounts() {
  const user = await getUser();
  return prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAccount(id: string) {
  const user = await getUser();
  return prisma.account.findFirst({
    where: { id, userId: user.id },
  });
}

export async function createAccount(raw: {
  name: string;
  broker: string;
  initialCapital: number;
  targetCapital: number;
  currency?: string;
  walletAddress?: string;
  walletNetwork?: string;
}) {
  let data;
  try {
    data = createAccountSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new Error(err.issues.map((i) => i.message).join(". "));
    }
    throw err;
  }
  const user = await getUser();
  checkRateLimit(user.id, "createAccount", 10, 60_000);
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: data.name,
      broker: data.broker,
      initialCapital: data.initialCapital,
      currentCapital: data.initialCapital,
      targetCapital: data.targetCapital,
      walletAddress: data.walletAddress || null,
      walletNetwork: data.walletNetwork || null,
      currency: data.currency || "USD",
    },
  });
  revalidatePath("/");
  revalidatePath("/accounts");
  return account;
}

export async function updateAccount(
  id: string,
  raw: {
    name?: string;
    broker?: string;
    targetCapital?: number;
    currency?: string;
    walletAddress?: string | null;
    walletNetwork?: string | null;
  }
) {
  const data = updateAccountSchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "updateAccount", 20, 60_000);
  const account = await prisma.account.updateMany({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath("/");
  revalidatePath("/accounts");
  return account;
}

export async function setActiveAccount(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { id: true },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const cookieStore = await cookies();
  cookieStore.set("activeAccountId", account.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  revalidatePath("/");
}

export async function getRiskRules(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { riskRules: true },
  });
  if (!account) throw new Error("Cuenta no encontrada");
  return (account.riskRules as { dailyLossLimit?: number; maxRiskPct?: number } | null) ?? {};
}

export async function updateRiskRules(
  accountId: string,
  rules: { dailyLossLimit?: number | null; maxRiskPct?: number | null }
) {
  const user = await getUser();
  checkRateLimit(user.id, "updateRiskRules", 20, 60_000);

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { id: true },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  await prisma.account.update({
    where: { id: accountId },
    data: { riskRules: rules },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function getDailyPnl(accountId: string) {
  const user = await getUser();
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { id: true },
  });
  if (!account) throw new Error("Cuenta no encontrada");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await prisma.$queryRaw<{ pnl: number }[]>`
    SELECT COALESCE(SUM(p.pnl), 0)::float AS pnl
    FROM trades t
    LEFT JOIN positions p ON p.trade_id = t.id
    WHERE t.account_id = ${accountId}
      AND t.status = 'CLOSED'
      AND t.closed_at >= ${today}
  `;

  return result?.pnl ?? 0;
}

export async function deleteAccount(id: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteAccount", 5, 60_000);
  await prisma.account.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/");
  revalidatePath("/accounts");
}
