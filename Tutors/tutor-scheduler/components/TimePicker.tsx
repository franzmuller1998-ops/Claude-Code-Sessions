"use client";

import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function splitValue(v: string): { h: string | null; m: string | null } {
  const match = /^(\d{2}):(\d{2})$/.exec(v);
  if (!match) return { h: null, m: null };
  return { h: match[1], m: match[2] };
}

// Текущее время "HH:mm" с минутами, округлёнными вниз к ближайшим 5
// (чтобы значение совпадало с одним из пунктов колонки минут).
function currentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Кастомный пикер времени в стиле «Liquid Glass» вместо нативного
 * <input type="time"> (его всплывающее «колесо» нельзя стилизовать).
 * Хранит значение "HH:mm" и сабмитит через скрытый input под именем {name},
 * поэтому серверные экшены менять не нужно.
 */
export default function TimePicker({
  name = "time",
  defaultValue = "",
  id,
  placeholder = "чч:мм",
}: {
  name?: string;
  defaultValue?: string;
  id?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const hoursRef = useRef<HTMLUListElement>(null);
  const minutesRef = useRef<HTMLUListElement>(null);

  const { h, m } = splitValue(value);

  // При открытии: если время ещё не выбрано — подставляем актуальное,
  // и прокручиваем колонки к выбранным значениям. Ручной выбор (скроллинг)
  // продолжает работать как раньше.
  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !value) setValue(currentTime());
      return next;
    });
  };

  // Сброс вместе с формой: формы вызывают form.reset() после успешного сабмита.
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setValue(defaultValue);
      setOpen(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  // Закрытие: клик вне поповера и Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Прокрутка колонок к выбранным значениям при открытии поповера.
  useEffect(() => {
    if (!open) return;
    for (const list of [hoursRef.current, minutesRef.current]) {
      const selected = list?.querySelector<HTMLElement>('[aria-current="true"]');
      if (selected) selected.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const pickHour = (hh: string) => setValue(`${hh}:${m ?? "00"}`);
  const pickMinute = (mm: string) => {
    setValue(`${h ?? "00"}:${mm}`);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input ref={hiddenRef} type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-slate-400">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Выбор времени"
          className="absolute left-0 right-0 z-20 mt-1 flex gap-1 rounded-xl border border-white/60 bg-white/60 p-1.5 shadow-lg ring-1 ring-white/40 backdrop-blur-md"
        >
          <ul ref={hoursRef} className="max-h-56 flex-1 overflow-y-auto" aria-label="Часы">
            {HOURS.map((hh) => (
              <li key={hh}>
                <button
                  type="button"
                  onClick={() => pickHour(hh)}
                  aria-current={hh === h}
                  aria-label={`${hh} часов`}
                  className={[
                    "w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors",
                    hh === h
                      ? "bg-indigo-600 text-white"
                      : "text-slate-900 hover:bg-indigo-50",
                  ].join(" ")}
                >
                  {hh}
                </button>
              </li>
            ))}
          </ul>
          <ul ref={minutesRef} className="max-h-56 flex-1 overflow-y-auto" aria-label="Минуты">
            {MINUTES.map((mm) => (
              <li key={mm}>
                <button
                  type="button"
                  onClick={() => pickMinute(mm)}
                  aria-current={mm === m}
                  aria-label={`${mm} минут`}
                  className={[
                    "w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors",
                    mm === m
                      ? "bg-indigo-600 text-white"
                      : "text-slate-900 hover:bg-indigo-50",
                  ].join(" ")}
                >
                  {mm}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
