import { redirect } from "next/navigation";
import { getCurrentTutor } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // По наличию репетитора в БД, а не только cookie — иначе устаревшая сессия
  // (удалённый репетитор) зацикливает редиректы /register ↔ /dashboard.
  if (await getCurrentTutor()) redirect("/dashboard");
  const { code } = await searchParams;
  return (
    <div className="relative z-10 w-full max-w-sm">
      <AuthForm mode="register" glass defaultCode={code} />
    </div>
  );
}
