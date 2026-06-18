import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убираем встроенный индикатор Next.js (значок «N» в углу) —
  // вместо него используем собственную анимацию загрузки (см. loading.tsx).
  devIndicators: false,

  // Разрешаем доступ к dev-ресурсам (HMR/Fast Refresh) при открытии приложения
  // не только по localhost, но и по 127.0.0.1. Иначе Next 16 блокирует
  // /_next/webpack-hmr как кросс-доменный запрос, HMR не подключается и dev-клиент
  // делает полную перезагрузку страницы — из-за чего фоновое видео перезапускается.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
