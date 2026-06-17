// Конфигурация pm2 для прод-сервера (VPS).
// Запускает два процесса:
//   1) tutor-web    — сам сайт Next.js (`next start`) на порту 3000;
//   2) tutor-worker — Telegram-бот (long-polling) + цикл напоминаний.
//
// Секреты НЕ здесь: оба процесса читают .env в корне проекта
//   - Next.js загружает .env автоматически;
//   - worker — через `import "dotenv/config"` (см. scripts/worker.ts).
//
// Использование:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup    # автозапуск после перезагрузки сервера
//   pm2 reload ecosystem.config.js   # после обновления кода

module.exports = {
  apps: [
    {
      name: "tutor-web",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "600M",
      time: true,
    },
    {
      // Только один инстанс: long-polling бота не должен дублироваться.
      // Дублирование напоминаний при этом всё равно невозможно — защищает
      // уникальный индекс Reminder(lessonId, recipient, remindAt).
      name: "tutor-worker",
      script: "npm",
      args: "run worker",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "300M",
      time: true,
    },
  ],
};
