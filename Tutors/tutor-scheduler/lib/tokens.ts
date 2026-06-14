import { randomBytes } from "crypto";

/** Короткий безопасный токен для ссылок-приглашений Telegram. */
export function generateLinkToken(): string {
  return randomBytes(12).toString("hex");
}

/** Ссылка-приглашение в Telegram-бота. */
export function inviteLink(token: string): string {
  const bot = process.env.NEXT_PUBLIC_BOT_USERNAME || "your_bot_username";
  return `https://t.me/${bot}?start=${token}`;
}
