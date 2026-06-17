#!/usr/bin/env bash
#
# Бэкап PostgreSQL: pg_dump -> gzip -> локальная папка + (опц.) S3 (Timeweb Cloud).
# Запуск вручную или по cron (см. DEPLOY.md, раздел «Бэкапы»).
#
# Конфигурация — через переменные окружения (можно из /etc/tutor-backup.env):
#   DB_NAME            имя базы (по умолчанию tutor_scheduler)
#   DB_USER            пользователь Postgres (по умолчанию tutor)
#   PGPASSWORD         пароль (или используйте ~/.pgpass / peer-аутентификацию)
#   BACKUP_DIR         локальная папка (по умолчанию /var/backups/tutor-scheduler)
#   RETENTION_DAYS     сколько дней хранить локально (по умолчанию 14)
#   S3_BUCKET          имя бакета; пусто => выгрузка в S3 пропускается
#   S3_ENDPOINT        endpoint S3 (Timeweb: https://s3.twcstorage.ru)
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  ключи S3
#
set -euo pipefail

DB_NAME="${DB_NAME:-tutor_scheduler}"
DB_USER="${DB_USER:-tutor}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tutor-scheduler}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-https://s3.twcstorage.ru}"

mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d_%H%M%S)"
file="$BACKUP_DIR/${DB_NAME}_${ts}.sql.gz"

echo "[backup] dump $DB_NAME -> $file"
pg_dump -U "$DB_USER" -h "${PGHOST:-localhost}" "$DB_NAME" | gzip > "$file"

if [ -n "$S3_BUCKET" ]; then
  echo "[backup] upload -> s3://$S3_BUCKET/db/"
  aws s3 cp "$file" "s3://$S3_BUCKET/db/" --endpoint-url "$S3_ENDPOINT"
else
  echo "[backup] S3_BUCKET не задан — выгрузка в облако пропущена"
fi

echo "[backup] чистка локальных бэкапов старше $RETENTION_DAYS дней"
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[backup] готово: $file"
