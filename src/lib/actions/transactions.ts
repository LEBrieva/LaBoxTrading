"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { createTransactionSchema, updateTransactionSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { TransactionType } from "@/generated/prisma/client";

async function verifyAccountOwnership(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) throw new Error("Cuenta no encontrada");
  return account;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/accounts");
}

export async function createTransaction(raw: {
  accountId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  date: string;
  note?: string;
}) {
  const data = createTransactionSchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "createTransaction", 30, 60_000);
  await verifyAccountOwnership(data.accountId, user.id);

  const capitalDelta = data.type === "DEPOSIT" ? data.amount : -data.amount;

  const result = await prisma.$transaction(async (db) => {
    const created = await db.accountTransaction.create({
      data: {
        accountId: data.accountId,
        type: data.type as TransactionType,
        amount: data.amount,
        date: new Date(data.date + "T12:00:00"),
        note: data.note || null,
      },
    });

    await db.account.update({
      where: { id: data.accountId },
      data: { currentCapital: { increment: capitalDelta } },
    });

    return created;
  });

  revalidateAll();
  return result;
}

export async function updateTransaction(
  id: string,
  raw: {
    type?: "DEPOSIT" | "WITHDRAWAL";
    amount?: number;
    date?: string;
    note?: string | null;
  }
) {
  const data = updateTransactionSchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "updateTransaction", 30, 60_000);

  const existing = await prisma.accountTransaction.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!existing || existing.account.userId !== user.id) {
    throw new Error("Transacción no encontrada");
  }

  const oldDelta = existing.type === "DEPOSIT" ? existing.amount : -existing.amount;
  const newType = data.type ?? existing.type;
  const newAmount = data.amount ?? existing.amount;
  const newDelta = newType === "DEPOSIT" ? newAmount : -newAmount;
  const netChange = newDelta - oldDelta;

  const result = await prisma.$transaction(async (db) => {
    const updated = await db.accountTransaction.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type as TransactionType }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.date && { date: new Date(data.date + "T12:00:00") }),
        ...(data.note !== undefined && { note: data.note }),
      },
    });

    if (netChange !== 0) {
      await db.account.update({
        where: { id: existing.accountId },
        data: { currentCapital: { increment: netChange } },
      });
    }

    return updated;
  });

  revalidateAll();
  return result;
}

export async function deleteTransaction(id: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteTransaction", 30, 60_000);

  const existing = await prisma.accountTransaction.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!existing || existing.account.userId !== user.id) {
    throw new Error("Transacción no encontrada");
  }

  const reverseDelta = existing.type === "DEPOSIT" ? -existing.amount : existing.amount;

  await prisma.$transaction(async (db) => {
    await db.accountTransaction.delete({ where: { id } });
    await db.account.update({
      where: { id: existing.accountId },
      data: { currentCapital: { increment: reverseDelta } },
    });
  });

  revalidateAll();
}

export async function getTransactions(accountId: string) {
  const user = await getUser();
  await verifyAccountOwnership(accountId, user.id);

  return prisma.accountTransaction.findMany({
    where: { accountId },
    orderBy: { date: "desc" },
  });
}
