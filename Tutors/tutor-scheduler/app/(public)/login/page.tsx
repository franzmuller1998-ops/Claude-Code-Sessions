import { redirect } from "next/navigation";
import { getCurrentTutor } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage() {
  // По наличию репетитора в БД, а не только cookie — иначе устаревшая сессия
  // (удалённый репетитор) зацикливает редиректы /login ↔ /dashboard.
  if (await getCurrentTutor()) redirect("/dashboard");
  return (
    <div className="relative z-10 w-full max-w-sm">
      <AuthForm mode="login" glass />
    </div>
  );
}
