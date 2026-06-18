"use client";

import { useEffect, useRef } from "react";

/**
 * Фоновое видео на всю страницу + тёплое затемнение для читаемости контента.
 * Используется на лендинге и страницах входа/регистрации. Контент кладётся
 * поверх с `relative z-10`.
 *
 * Автозапуск делаем «надёжно»: одного атрибута autoplay недостаточно — часть
 * браузеров (Opera, мобильные с энергосбережением) показывают первый кадр, но
 * не стартуют воспроизведение. Поэтому принудительно ставим muted и вызываем
 * play() из кода, а также повторяем попытку, когда видео готово и когда вкладка
 * снова становится активной.
 */
export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Гарантируем muted на уровне DOM-свойства (иначе браузер блокирует autoplay).
    v.muted = true;

    const tryPlay = () => {
      const p = v.play();
      if (p) p.catch(() => {});
    };

    tryPlay();
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/tutor_vid_h264_new.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#2d2620]/30" aria-hidden />
    </>
  );
}
