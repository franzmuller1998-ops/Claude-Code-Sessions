import VideoBackground from "@/components/VideoBackground";

/**
 * Общий layout для всех публичных страниц (лендинг, вход, регистрация).
 * Видео живёт здесь — в общем сегменте, который сохраняется при переходах
 * между /, /login и /register, — поэтому фон не перезапускается ни при
 * навигации, ни при обновлении формы (server action в useActionState).
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <VideoBackground />
      {children}
    </main>
  );
}
