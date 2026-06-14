"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createLessonAction,
  createRecurrenceAction,
  type LessonActionState,
} from "@/app/actions/lessons";
import { ToastProvider, useToast, type ToastInput } from "@/components/Toast";
import TimePicker from "@/components/TimePicker";
import { WEEKDAY_LABELS } from "@/lib/constants";

export type StudentLite = {
  id: string;
  name: string;
  subject: string | null;
  linked: boolean;
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const initial: LessonActionState = { ok: false };

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const label = "block text-sm font-medium text-slate-700 mb-1";

function pluralLessons(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "занятие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "занятия";
  return "занятий";
}

function toastFromState(s: LessonActionState): ToastInput {
  const name = s.studentName ?? "ученик";
  const n = s.createdCount ?? 1;

  if (n === 0) {
    return {
      message:
        "Серия сохранена, но в ближайшее время занятий не выпало — проверьте дни недели и даты.",
      variant: "warning",
    };
  }

  const created = n === 1 ? "Занятие создано" : `Создано ${n} ${pluralLessons(n)}`;

  if (s.notified) {
    const tail =
      n === 1
        ? `${name} получил(а) уведомление в Telegram и скоро подтвердит.`
        : `${name} получил(а) сводное уведомление в Telegram.`;
    return { message: `${created}. ${tail}`, variant: "success" };
  }

  return {
    message: `${created}, но у ${name} не подключён Telegram — отправьте ссылку-приглашение.`,
    variant: "warning",
    href: s.studentId ? `/students/${s.studentId}` : undefined,
    linkLabel: "Карточка ученика",
  };
}

/** Реагирует на результат экшена: показывает toast и очищает форму при успехе. */
function useActionToast(
  state: LessonActionState,
  formRef: React.RefObject<HTMLFormElement | null>,
) {
  const toast = useToast();
  const handled = useRef<LessonActionState | null>(null);

  useEffect(() => {
    if (state === initial || handled.current === state) return;
    handled.current = state;

    if (state.ok) {
      toast(toastFromState(state));
      formRef.current?.reset();
    } else if (state.error) {
      toast({ message: state.error, variant: "error" });
    }
  }, [state, toast, formRef]);
}

function StudentOptions({ students }: { students: StudentLite[] }) {
  return (
    <>
      {students.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.subject ? ` (${s.subject})` : ""}
          {s.linked ? "" : " — без Telegram"}
        </option>
      ))}
    </>
  );
}

function OneOffForm({ students, minDate }: { students: StudentLite[]; minDate: string }) {
  const [state, formAction, pending] = useActionState(createLessonAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, formRef);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-slate-900">Разовое занятие</h2>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label className={label}>Ученик</label>
          <select name="studentId" className={input} required>
            <StudentOptions students={students} />
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Дата</label>
            <input type="date" name="date" className={input} min={minDate} required />
          </div>
          <div>
            <label className={label}>Время</label>
            <TimePicker name="time" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Длительность (мин)</label>
            <input
              type="number"
              name="durationMin"
              className={input}
              defaultValue={60}
              min={1}
              max={360}
              step={1}
            />
          </div>
          <div>
            <label className={label}>Предмет (необязательно)</label>
            <input name="subject" className={input} />
          </div>
        </div>
        <button
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Создаём…" : "Создать занятие"}
        </button>
      </form>
    </section>
  );
}

function RecurrenceForm({ students, minDate }: { students: StudentLite[]; minDate: string }) {
  const [state, formAction, pending] = useActionState(createRecurrenceAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, formRef);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-slate-900">Повторяющееся занятие</h2>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label className={label}>Ученик</label>
          <select name="studentId" className={input} required>
            <StudentOptions students={students} />
          </select>
        </div>
        <div>
          <label className={label}>Дни недели</label>
          <div className="flex flex-wrap gap-2">
            {WEEK_ORDER.map((d) => (
              <label
                key={d}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm has-checked:border-indigo-500 has-checked:bg-indigo-50"
              >
                <input type="checkbox" name="daysOfWeek" value={d} />
                {WEEKDAY_LABELS[d]}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Время</label>
            <TimePicker name="time" />
          </div>
          <div>
            <label className={label}>Длительность (мин)</label>
            <input
              type="number"
              name="durationMin"
              className={input}
              defaultValue={60}
              min={1}
              max={360}
              step={1}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>С даты</label>
            <input type="date" name="startDate" className={input} min={minDate} required />
          </div>
          <div>
            <label className={label}>По дату (необязательно)</label>
            <input type="date" name="endDate" className={input} min={minDate} />
          </div>
        </div>
        <div>
          <label className={label}>Предмет (необязательно)</label>
          <input name="subject" className={input} />
        </div>
        <button
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Создаём…" : "Создать серию"}
        </button>
      </form>
    </section>
  );
}

export default function LessonForms({
  students,
  minDate,
}: {
  students: StudentLite[];
  minDate: string;
}) {
  return (
    <ToastProvider>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OneOffForm students={students} minDate={minDate} />
        <RecurrenceForm students={students} minDate={minDate} />
      </div>
    </ToastProvider>
  );
}
