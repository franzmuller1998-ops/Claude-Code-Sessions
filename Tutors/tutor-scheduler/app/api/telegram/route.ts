import { webhookCallback } from "grammy";
import { getBot } from "@/lib/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bot = getBot();

// В проде Telegram шлёт апдейты на этот URL (см. README про setWebhook).
export const POST = bot
  ? webhookCallback(bot, "std/http")
  : async () => new Response("Telegram bot is not configured", { status: 503 });
