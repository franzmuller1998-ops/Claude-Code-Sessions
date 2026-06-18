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

// Алфавит без двусмысленных символов (нет 0/O/1/I/L) — код удобно вводить вручную.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Короткий одноразовый код привязки Telegram (для ввода при регистрации). */
export function generateTelegramCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** Абсолютный URL на сайте по пути (берёт базу из APP_URL). */
export function siteUrl(path = "/"): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Абсолютный URL страницы регистрации (с опциональным предзаполненным кодом). */
export function registerUrl(code?: string): string {
  return siteUrl(code ? `/register?code=${encodeURIComponent(code)}` : "/register");
}
