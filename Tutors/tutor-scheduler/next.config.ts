import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убираем встроенный индикатор Next.js (значок «N» в углу) —
  // вместо него используем собственную анимацию загрузки (см. loading.tsx).
  devIndicators: false,
};

export default nextConfig;
