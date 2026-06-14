import { NextRequest } from "next/server";
import { processDueReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Вызывается планировщиком (Vercel Cron / внешний cron) раз в минуту.
// Защита: ?secret=... или заголовок Authorization: Bearer <CRON_SECRET>.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const auth = req.headers.get("authorization");
    const provided =
      url.searchParams.get("secret") ||
      (auth?.startsWith("Bearer ") ? auth.slice(7) : null);
    if (provided !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const result = await processDueReminders();
  return Response.json({ ok: true, ...result, at: new Date().toISOString() });
}
