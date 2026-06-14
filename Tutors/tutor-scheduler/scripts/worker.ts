// Фоновый процесс для разработки: long-polling Telegram-бота + цикл напоминаний.
// Запуск: npm run worker
import "dotenv/config";
import { getBot } from "@/lib/bot";
import { processDueReminders } from "@/lib/reminders";

const INTERVAL_MS = 30_000;

async function main() {
  const bot = getBot();
  if (bot) {
    // start() не await-им: он держит свой polling-цикл сам.
    bot.start({
      onStart: (me) => console.log(`🤖 Бот @${me.username} запущен (polling).`),
    });
  } else {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN не задан — бот не запущен, только напоминания.");
  }

  const tick = async () => {
    try {
      const r = await processDueReminders();
      if (r.processed > 0) {
        console.log(`[reminders ${new Date().toLocaleTimeString()}]`, r);
      }
    } catch (e) {
      console.error("[reminders] ошибка:", e);
    }
  };

  await tick();
  setInterval(tick, INTERVAL_MS);
  console.log(`⏰ Планировщик напоминаний запущен (каждые ${INTERVAL_MS / 1000} c).`);
}

main();
