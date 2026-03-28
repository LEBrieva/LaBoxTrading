"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "./auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL || "latradingbox@gmail.com";
const MIN_ACCOUNT_AGE_DAYS = 2;
const MIN_TRADES = 10;

interface FeedbackEligibility {
  eligible: boolean;
  reason?: string;
}

export async function checkFeedbackEligibility(): Promise<FeedbackEligibility> {
  const user = await getUser();

  // Check account age (1 week)
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < MIN_ACCOUNT_AGE_DAYS) {
    const remaining = MIN_ACCOUNT_AGE_DAYS - daysSinceCreation;
    return {
      eligible: false,
      reason: `Tu cuenta debe tener al menos 2 días. Faltan ${remaining} día${remaining === 1 ? "" : "s"}.`,
    };
  }

  // Check trade count (10+)
  const tradeCount = await prisma.trade.count({
    where: { account: { userId: user.id } },
  });
  if (tradeCount < MIN_TRADES) {
    return {
      eligible: false,
      reason: `Necesitás al menos ${MIN_TRADES} trades para enviar feedback. Tenés ${tradeCount}.`,
    };
  }

  // Check daily limit (1 per day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const feedbackToday = await prisma.feedback.count({
    where: {
      userId: user.id,
      createdAt: { gte: todayStart },
    },
  });
  if (feedbackToday > 0) {
    return {
      eligible: false,
      reason: "Ya enviaste feedback hoy. Podés enviar otro mañana.",
    };
  }

  return { eligible: true };
}

export async function sendFeedback(message: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  checkRateLimit(user.id, "feedback", 3, 60_000);

  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: "El mensaje no puede estar vacío." };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "El mensaje no puede superar los 2000 caracteres." };
  }

  // Re-check eligibility server-side
  const eligibility = await checkFeedbackEligibility();
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  // Save to DB
  await prisma.feedback.create({
    data: {
      userId: user.id,
      message: trimmed,
    },
  });

  // Send email
  try {
    await resend.emails.send({
      from: "La Trading Box <noreply@tradingbox.app>",
      to: FEEDBACK_EMAIL,
      subject: `Feedback de ${user.email}`,
      text: `De: ${user.email}\nUsuario: ${user.name || "Sin nombre"}\nID: ${user.id}\nFecha: ${new Date().toISOString()}\n\n---\n\n${trimmed}`,
    });
  } catch {
    // Email failed but feedback is saved in DB — don't fail the user
  }

  return { success: true };
}
