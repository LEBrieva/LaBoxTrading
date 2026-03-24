"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { upsertJournalEntrySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { Mood } from "@/generated/prisma/client";

// Calendar data: mood + preview per day for a given month
export async function getJournalCalendarData(year: number, month: number) {
  const user = await getUser();
  checkRateLimit(user.id, "getJournalCalendar", 30, 60_000);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      date: { gte: start, lt: end },
    },
    select: {
      id: true,
      date: true,
      mood: true,
      tags: true,
      content: true,
    },
    orderBy: { date: "asc" },
  });

  return entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    mood: e.mood,
    tags: e.tags,
    preview: e.content.slice(0, 100),
  }));
}

// Full entry for a specific date
export async function getJournalEntry(dateStr: string) {
  const user = await getUser();
  checkRateLimit(user.id, "getJournalEntry", 30, 60_000);

  const date = new Date(dateStr + "T12:00:00Z");

  const entry = await prisma.journalEntry.findUnique({
    where: {
      userId_date: { userId: user.id, date },
    },
  });

  return entry;
}

// Create or update entry for a date
export async function upsertJournalEntry(raw: {
  date: string;
  content: string;
  mood: string;
  tags?: string[];
}) {
  const data = upsertJournalEntrySchema.parse(raw);
  const user = await getUser();
  checkRateLimit(user.id, "upsertJournalEntry", 30, 60_000);

  const date = new Date(data.date + "T12:00:00Z");

  const entry = await prisma.journalEntry.upsert({
    where: {
      userId_date: { userId: user.id, date },
    },
    create: {
      userId: user.id,
      date,
      content: data.content,
      mood: data.mood as Mood,
      tags: data.tags ?? [],
    },
    update: {
      content: data.content,
      mood: data.mood as Mood,
      tags: data.tags ?? [],
    },
  });

  return entry;
}

// Delete entry by id
export async function deleteJournalEntry(id: string) {
  const user = await getUser();
  checkRateLimit(user.id, "deleteJournalEntry", 30, 60_000);

  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    throw new Error("Entrada no encontrada");
  }

  await prisma.journalEntry.delete({ where: { id } });
}
