"use server";

import { prisma } from "@/lib/prisma";
import type { Broker } from "@/generated/prisma/client";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";

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

export async function createAccount(data: {
  name: string;
  broker: Broker;
  initialCapital: number;
  targetCapital: number;
  currency?: string;
  walletAddress?: string;
  walletNetwork?: string;
}) {
  const user = await getUser();
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
  data: {
    name?: string;
    broker?: Broker;
    targetCapital?: number;
    currency?: string;
    walletAddress?: string | null;
    walletNetwork?: string | null;
  }
) {
  const user = await getUser();
  const account = await prisma.account.updateMany({
    where: { id, userId: user.id },
    data,
  });
  revalidatePath("/");
  revalidatePath("/accounts");
  return account;
}

export async function deleteAccount(id: string) {
  const user = await getUser();
  await prisma.account.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/");
  revalidatePath("/accounts");
}
