import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import { formatLessonTime } from "@/lib/time";

// Ленивая инициализация: бот создаётся только при наличии токена.
let _bot: Bot | null = null;

export function getBot(): Bot | null {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  _bot = new Bot(token);
  registerHandlers(_bot);
  return _bot;
}

function registerHandlers(bot: Bot) {
  // Привязка по токену из ссылки t.me/<bot>?start=<token>.
  bot.command("start", async (ctx) => {
    const token = ctx.match?.trim();
    const chatId = String(ctx.chat.id);

    if (!token) {
      await ctx.reply(
        "Привет! 👋\nЧтобы получать напоминания о занятиях, откройте персональную ссылку-приглашение от репетитора.",
      );
      return;
    }

    // Токен может принадлежать ученику или репетитору.
    const student = await prisma.student.findUnique({ where: { linkToken: token } });
    if (student) {
      await prisma.student.update({
        where: { id: student.id },
        data: { telegramChatId: chatId, linkedAt: new Date(), linkToken: null },
      });
      await ctx.reply(
        `Готово, ${student.name}! 📚\nТеперь напоминания о занятиях будут приходить сюда.`,
      );
      return;
    }

    const tutor = await prisma.tutor.findUnique({ where: { linkToken: token } });
    if (tutor) {
      await prisma.tutor.update({
        where: { id: tutor.id },
        data: { telegramChatId: chatId, linkedAt: new Date(), linkToken: null },
      });
      await ctx.reply(
        `Готово, ${tutor.name}! ✅\nВы будете получать напоминания о своих занятиях здесь.`,
      );
      return;
    }

    await ctx.reply(
      "Ссылка недействительна или уже использована. Попросите новую ссылку-приглашение.",
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Я напоминаю о занятиях. Привязка происходит по персональной ссылке-приглашению от репетитора.",
    );
  });

  // Ученик подтверждает занятие.
  bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
    const lessonId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: "Спасибо, занятие подтверждено!" });
    await notifyTutor(lessonId, (who, when) => `✅ ${who} подтвердил(а) занятие ${when}.`);
    await safeEditReplyMarkup(ctx);
  });

  // Ученик просит перенос.
  bot.callbackQuery(/^reschedule:(.+)$/, async (ctx) => {
    const lessonId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: "Запрос на перенос отправлен репетитору." });
    await notifyTutor(
      lessonId,
      (who, when) => `🔁 ${who} просит перенести занятие ${when}. Свяжитесь с учеником.`,
    );
    await safeEditReplyMarkup(ctx);
  });
}

async function safeEditReplyMarkup(ctx: { editMessageReplyMarkup: () => Promise<unknown> }) {
  try {
    await ctx.editMessageReplyMarkup();
  } catch {
    // сообщение могло устареть — игнорируем
  }
}

/** Шлёт сообщение репетитору про занятие (если он привязал Telegram). */
async function notifyTutor(lessonId: string, build: (who: string, when: string) => string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { tutor: true, student: true },
  });
  if (!lesson?.tutor.telegramChatId) return;
  const when = formatLessonTime(lesson.startAt, lesson.tutor.timezone);
  const bot = getBot();
  if (!bot) return;
  await bot.api.sendMessage(lesson.tutor.telegramChatId, build(lesson.student.name, when));
}

/** Клавиатура подтверждения для напоминания ученику. */
export function lessonKeyboard(lessonId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Подтверждаю", `confirm:${lessonId}`)
    .text("🔁 Перенести", `reschedule:${lessonId}`);
}

// Транзиентные сетевые ошибки, на которых имеет смысл повторить попытку.
// В простаивающем веб-процессе keep-alive сокет к Telegram может умереть и дать
// ECONNRESET/socket hang up при первой отправке — повтор открывает свежий коннект.
function isTransientNetworkError(e: unknown): boolean {
  const s = String((e as { message?: string })?.message ?? e);
  return /ECONNRESET|socket hang up|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|network|fetch failed|request to .* failed/i.test(
    s,
  );
}

/**
 * Низкоуровневая отправка сообщения с ретраями на транзиентные сетевые сбои.
 * Возвращает true при успехе.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  keyboard?: InlineKeyboard,
  attempts = 3,
): Promise<boolean> {
  const bot = getBot();
  if (!bot) return false;

  for (let i = 1; i <= attempts; i++) {
    try {
      await bot.api.sendMessage(
        chatId,
        text,
        keyboard ? { reply_markup: keyboard } : undefined,
      );
      return true;
    } catch (e) {
      const transient = isTransientNetworkError(e);
      if (transient && i < attempts) {
        await new Promise((r) => setTimeout(r, 300 * i)); // 300мс, 600мс…
        continue;
      }
      console.error(
        `sendTelegramMessage failed (попытка ${i}/${attempts}):`,
        (e as Error)?.message ?? e,
      );
      return false;
    }
  }
  return false;
}
