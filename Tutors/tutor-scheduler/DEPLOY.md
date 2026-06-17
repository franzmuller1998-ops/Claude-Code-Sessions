# Деплой на VPS (Timeweb, Ubuntu 24.04) + self-hosted PostgreSQL

Пошаговая инструкция для боевого запуска `tutor-scheduler` на одном VPS.

**Целевой сервер:** Ubuntu 24.04, 2 vCPU, 4 ГБ RAM, 40 ГБ NVMe, Санкт-Петербург.

## Архитектура на сервере

```
Интернет → Caddy (:80/:443, авто-TLS) → Next.js (:3000)   ← pm2: tutor-web
                                          worker (бот+напоминания) ← pm2: tutor-worker
                                          PostgreSQL (:5432, локально)
бэкапы: cron → scripts/backup-db.sh → /var/backups + S3 (Timeweb)
```

- **Telegram работает через long-polling** внутри worker — публичный webhook не нужен.
- Оба процесса (`tutor-web`, `tutor-worker`) читают секреты из `.env` в корне проекта.

## 0. Что нужно заранее

- Домен (например `example.ru`) и доступ к его DNS.
- Токен бота от [@BotFather](https://t.me/BotFather) и username бота.
- Доступ к VPS по SSH (root или sudo-пользователь).

---

## 1. Базовая настройка сервера

```bash
ssh root@SERVER_IP

apt update && apt upgrade -y

# (рекомендуется) отдельный пользователь вместо root
adduser deploy && usermod -aG sudo deploy
# далее работайте под deploy: ssh deploy@SERVER_IP

# Firewall: SSH + HTTP + HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## 2. Установка ПО

```bash
# Node.js 20 (нужен для Next 16)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# PostgreSQL
sudo apt-get install -y postgresql

# pm2 (менеджер процессов)
sudo npm install -g pm2

# AWS CLI (для выгрузки бэкапов в S3-совместимое хранилище Timeweb)
sudo apt-get install -y awscli

# Caddy (reverse-proxy с авто-TLS)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

## 3. Настройка PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER tutor WITH PASSWORD 'ПРИДУМАЙТЕ_СИЛЬНЫЙ_ПАРОЛЬ';
CREATE DATABASE tutor_scheduler OWNER tutor;
SQL
```

Строка подключения будет:
```
postgresql://tutor:ПАРОЛЬ@localhost:5432/tutor_scheduler?schema=public
```

## 4. Деплой кода

```bash
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> tutor-scheduler
cd tutor-scheduler/tutor-scheduler   # перейдите в папку с package.json
```

Создайте `.env` в корне проекта (рядом с `package.json`):

```bash
# сгенерировать секреты
openssl rand -base64 32   # для AUTH_SECRET
openssl rand -base64 32   # для CRON_SECRET

nano .env
```

Содержимое `.env` (по образцу `.env.example`):
```dotenv
DATABASE_URL="postgresql://tutor:ПАРОЛЬ@localhost:5432/tutor_scheduler?schema=public"
AUTH_SECRET="<сгенерированная строка>"
TELEGRAM_BOT_TOKEN="<токен от BotFather>"
NEXT_PUBLIC_BOT_USERNAME="<username_бота_без_@>"
ADMIN_TELEGRAM_CHAT_ID="<ваш chat_id или пусто>"
APP_URL="https://example.ru"
CRON_SECRET="<сгенерированная строка>"
```

> ⚠️ `NEXT_PUBLIC_BOT_USERNAME` и `APP_URL` вшиваются в сборку — `.env` должен
> существовать **до** `npm run build`.

Установка зависимостей, миграции, сборка:
```bash
npm ci                      # ставит и dev-зависимости (нужны для сборки и worker/tsx)
npx prisma migrate deploy   # применяет миграции к PostgreSQL
# (опционально) демо-данные:  npm run seed
npm run build
```

## 5. Запуск через pm2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd          # выполните команду, которую pm2 распечатает
pm2 status                   # tutor-web и tutor-worker должны быть online
pm2 logs                     # посмотреть логи
```

## 6. Домен и Caddy

1. В DNS домена создайте A-записи на IP сервера:
   - `example.ru` → `SERVER_IP`
   - `www.example.ru` → `SERVER_IP` (если нужен www-редирект)
2. Установите конфиг Caddy (замените `example.ru` на свой домен):
   ```bash
   sudo cp /var/www/tutor-scheduler/tutor-scheduler/Caddyfile /etc/caddy/Caddyfile
   sudo nano /etc/caddy/Caddyfile     # впишите свой домен
   sudo systemctl reload caddy
   ```
3. Откройте `https://example.ru` — Caddy сам выпустит сертификат. Должна
   открыться главная (лендинг) с видео.

## 7. Telegram-бот

При запущенном `tutor-worker` бот уже работает через polling — **дополнительно
ничего настраивать не нужно**. Проверка:
- напишите боту `/id` — он ответит ваш `chat_id` (его можно вписать в `ADMIN_TELEGRAM_CHAT_ID`);
- создайте занятие и привяжите ученика по ссылке-приглашению.

> Если когда-нибудь захотите перейти на webhook вместо polling: уберите запуск
> бота из `scripts/worker.ts`, оставив только цикл напоминаний, и один раз
> вызовите `setWebhook` на `https://example.ru/api/telegram`. Для текущего
> сценария это не требуется.

## 8. Бэкапы БД

Скрипт: `scripts/backup-db.sh` (pg_dump → gzip → локальная папка + S3).

1. Сделайте исполняемым:
   ```bash
   chmod +x /var/www/tutor-scheduler/tutor-scheduler/scripts/backup-db.sh
   ```
2. Создайте бакет в **Timeweb Cloud → Объектное хранилище (S3)** и получите ключи.
3. Положите настройки бэкапа в отдельный файл `/etc/tutor-backup.env`:
   ```dotenv
   DB_NAME=tutor_scheduler
   DB_USER=tutor
   PGPASSWORD=ПАРОЛЬ_БД
   BACKUP_DIR=/var/backups/tutor-scheduler
   RETENTION_DAYS=14
   S3_BUCKET=ваш-бакет
   S3_ENDPOINT=https://s3.twcstorage.ru
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```
   ```bash
   sudo chmod 600 /etc/tutor-backup.env
   ```
4. Проверьте вручную:
   ```bash
   set -a && . /etc/tutor-backup.env && set +a
   /var/www/tutor-scheduler/tutor-scheduler/scripts/backup-db.sh
   ```
5. Поставьте в cron (ежедневно в 03:00):
   ```bash
   sudo crontab -e
   ```
   ```cron
   0 3 * * * set -a; . /etc/tutor-backup.env; set +a; /var/www/tutor-scheduler/tutor-scheduler/scripts/backup-db.sh >> /var/log/tutor-backup.log 2>&1
   ```

Восстановление из бэкапа:
```bash
gunzip -c tutor_scheduler_YYYYMMDD_HHMMSS.sql.gz | psql -U tutor tutor_scheduler
```

## 9. Обновление приложения

```bash
cd /var/www/tutor-scheduler/tutor-scheduler
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js
```

## 10. Проверка и диагностика

```bash
pm2 status                       # оба процесса online
pm2 logs tutor-web --lines 50
pm2 logs tutor-worker --lines 50
sudo systemctl status caddy
curl -I https://example.ru       # 200 OK
sudo -u postgres psql -c "\l"    # база на месте
```

Частые проблемы:
- **Сборка падает по памяти** — на 4 ГБ обычно ок; если что, добавьте swap:
  `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`
  (и строку в `/etc/fstab`: `/swapfile none swap sw 0 0`).
- **502 от Caddy** — `tutor-web` не запущен или не на 3000: `pm2 logs tutor-web`.
- **Бот молчит** — проверьте `TELEGRAM_BOT_TOKEN` в `.env` и `pm2 logs tutor-worker`.
- **Нет TLS** — A-запись ещё не распространилась или закрыты порты 80/443.
