import { useEffect, useRef } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'
import earthVideo from '../assets/Earths_orbit.mp4'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackRate = useJourneyStore((s) => s.videoPlaybackRate)
  const rateRef = useRef(playbackRate)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.loop = true
    video.playsInline = true

    const play = () => video.play().catch(() => {})
    if (video.readyState >= 3) {
      play()
    } else {
      video.addEventListener('canplay', play, { once: true })
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const target = playbackRate
    rateRef.current = target

    // Smoothly interpolate playback rate over ~800ms
    const start = video.playbackRate
    const startTime = performance.now()
    const duration = 800

    let raf: number
    const animate = (now: number) => {
      if (rateRef.current !== target) return // superseded
      const t = Math.min((now - startTime) / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      video.playbackRate = start + (target - start) * eased
      if (t < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [playbackRate])

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 w-full h-full object-cover"
      style={{ zIndex: 0 }}
      src={earthVideo}
      muted
      loop
      playsInline
    />
  )
}
