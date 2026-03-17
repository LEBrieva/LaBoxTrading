"use server";

import { prisma } from "@/lib/prisma";
import { getTrade } from "./trades";
import { revalidatePath } from "next/cache";

export async function addTradeImage(
  tradeId: string,
  url: string,
  caption?: string
) {
  await getTrade(tradeId); // verifies ownership

  const image = await prisma.tradeImage.create({
    data: {
      tradeId,
      url,
      caption: caption || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/trades");
  return image;
}

export async function getTradeImages(tradeId: string) {
  await getTrade(tradeId);

  return prisma.tradeImage.findMany({
    where: { tradeId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteTradeImage(imageId: string) {
  const image = await prisma.tradeImage.findUnique({
    where: { id: imageId },
    include: { trade: true },
  });
  if (!image) throw new Error("Imagen no encontrada");

  await getTrade(image.tradeId); // verifies ownership

  await prisma.tradeImage.delete({ where: { id: imageId } });

  revalidatePath("/");
  revalidatePath("/trades");
}
