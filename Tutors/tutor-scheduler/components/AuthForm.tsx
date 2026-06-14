"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, loginAction, type AuthState } from "@/app/actions/auth";
import { COMMON_TIMEZONES } from "@/lib/constants";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const label = "block text-sm font-medium text-slate-700 mb-1";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "register" ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        {mode === "register" ? "Регистрация репетитора" : "Вход"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {mode === "register"
          ? "Создайте аккаунт, чтобы вести расписание."
          : "Войдите в свой кабинет."}
      </p>

      <form action={formAction} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className={label} htmlFor="name">
              Имя
            </label>
            <input id="name" name="name" className={input} autoComplete="name" />
          </div>
        )}

        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={input}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={label} htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={input}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </div>

        {mode === "register" && (
          <div>
            <label className={label} htmlFor="timezone">
              Часовой пояс
            </label>
            <select
              id="timezone"
              name="timezone"
              defaultValue="Europe/Moscow"
              className={input}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        )}

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending
            ? "Подождите…"
            : mode === "register"
              ? "Зарегистрироваться"
              : "Войти"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "register" ? (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
