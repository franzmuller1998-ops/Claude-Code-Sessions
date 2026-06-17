import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionTutorId } from "@/lib/auth";
import VideoBackground from "@/components/VideoBackground";

export default async function Home() {
  // Авторизованных сразу в кабинет, остальным — лендинг.
  if (await getSessionTutorId()) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/50 bg-[#efe2cf]/40 p-8 text-center shadow-2xl ring-1 ring-white/30 backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-slate-900">📚 Репетитор</h1>
        <p className="-mt-1 text-center text-base font-bold text-slate-900">расписание</p>
        <p className="mt-3 text-sm font-medium text-slate-900">
          Расписание занятий с учениками и автоматические напоминания в Telegram.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-white/50 bg-white/40 px-4 py-2 text-sm font-medium text-slate-900 backdrop-blur-sm transition hover:bg-white/60"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </main>
  );
}
