import { redirect } from "next/navigation";
import { getSessionTutorId } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import VideoBackground from "@/components/VideoBackground";

export default async function RegisterPage() {
  if (await getSessionTutorId()) redirect("/dashboard");
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-sm">
        <AuthForm mode="register" glass />
      </div>
    </main>
  );
}
