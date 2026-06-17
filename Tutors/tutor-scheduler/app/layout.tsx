import type { Metadata } from "next";
// Дружелюбный округлый шрифт с поддержкой кириллицы — под тёплую пастельную тему.
// Подключаем локально (self-hosted), а не через next/font/google, чтобы сборка
// не зависела от доступа к fonts.gstatic.com. Семейство: "Nunito Variable".
import "@fontsource-variable/nunito/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Репетитор · расписание и напоминания",
  description:
    "Расписание занятий с учениками и автоматические напоминания в Telegram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
