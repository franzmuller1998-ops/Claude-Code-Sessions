import { redirect } from "next/navigation";
import { getSessionTutorId } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage() {
  if (await getSessionTutorId()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthForm mode="login" />
    </main>
  );
}
