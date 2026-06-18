/**
 * Фоновое видео на всю страницу + тёплое затемнение для читаемости контента.
 * Используется на лендинге и странице входа. Контент кладётся поверх с `relative z-10`.
 */
export default function VideoBackground() {
  return (
    <>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/tutor_vid_lowQ.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#2d2620]/30" aria-hidden />
    </>
  );
}
