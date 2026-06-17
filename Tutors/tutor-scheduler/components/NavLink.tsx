"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Маленький спиннер в левом нижнем углу, который виден, пока грузится
 * страница перехода. Текущая страница при этом остаётся на экране
 * (отдельного loading-экрана нет). useLinkStatus сообщает статус
 * перехода ближайшего родительского <Link>.
 */
function CornerSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-500 shadow-lg backdrop-blur"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      Загрузка…
    </span>
  );
}

export default function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
      <CornerSpinner />
    </Link>
  );
}
