"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { createStrategySchema, updateStrategySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function getStrategies() {
  const user = await getUser();
  return prisma.strategy.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function getStrategy(id: string) {
  const user = await getUser();
  const strategy = await prisma.strategy.findFirst({
    where: { id, userId: user.id },
  });
  if (!strategy) throw new Error("Estrategia no encontrada");
  return strategy;
}

export async function createStrategy(raw: {
  name: string;
  description?: string;
  fields: unknown[];
}) {
  const data = createStrategySchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "createStrategy", 10, 60_000);

  const strategy = await prisma.strategy.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description || null,
      fields: data.fields,
    },
  });

  revalidatePath("/strategies");
  return strategy;
}

export async function updateStrategy(
  id: string,
  raw: {
    name?: string;
    description?: string | null;
    fields?: unknown[];
  }
) {
  const data = updateStrategySchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "updateStrategy", 20, 60_000);

  const strategy = await prisma.strategy.findFirst({
    where: { id, userId: user.id },
  });
  if (!strategy) throw new Error("Estrategia no encontrada");

  const updated = await prisma.strategy.update({
    where: { id },
    data,
  });

  revalidatePath("/strategies");
  return updated;
}

export async function deleteStrategy(id: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteStrategy", 5, 60_000);

  const strategy = await prisma.strategy.findFirst({
    where: { id, userId: user.id },
  });
  if (!strategy) throw new Error("Estrategia no encontrada");

  await prisma.strategy.delete({ where: { id } });

  revalidatePath("/strategies");
}
