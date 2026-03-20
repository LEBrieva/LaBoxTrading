"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getTrade } from "./trades";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { saveChecklistSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function getTradeChecklist(tradeId: string) {
  await getTrade(tradeId); // verifies ownership
  return prisma.tradeChecklist.findUnique({
    where: { tradeId },
    include: { strategy: true },
  });
}

export async function saveTradeChecklist(raw: {
  tradeId: string;
  strategyId: string;
  values: Record<string, unknown>;
}) {
  const data = saveChecklistSchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "saveChecklist", 30, 60_000);
  await getTrade(data.tradeId); // verifies ownership

  const jsonValues = data.values as Prisma.InputJsonValue;
  const checklist = await prisma.tradeChecklist.upsert({
    where: { tradeId: data.tradeId },
    create: {
      tradeId: data.tradeId,
      strategyId: data.strategyId,
      values: jsonValues,
    },
    update: {
      strategyId: data.strategyId,
      values: jsonValues,
    },
    include: { strategy: true },
  });

  return checklist;
}

export async function deleteTradeChecklist(tradeId: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteChecklist", 10, 60_000);
  await getTrade(tradeId); // verifies ownership

  await prisma.tradeChecklist.delete({
    where: { tradeId },
  });
}
