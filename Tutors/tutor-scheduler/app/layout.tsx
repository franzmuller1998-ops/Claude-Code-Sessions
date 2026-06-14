import type { Metadata } from "next";
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
