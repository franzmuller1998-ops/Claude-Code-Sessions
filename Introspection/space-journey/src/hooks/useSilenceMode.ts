import { useEffect, useRef } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'

const STAGE_RATES: Record<string, number> = {
  LAUNCH: 0.5,
  ORBIT: 1.0,
  DEEP_SPACE: 1.5,
}

// Silence triggers at 8s (SILENCE_THRESHOLD_MS in useSpeechRecognition)
const SILENCE_TRIGGER_S = 8
// Seconds after trigger to ease down to minimum rate
const SLOWDOWN_DURATION_S = 30
const MIN_RATE = 0.08

export function useSilenceMode() {
  const speechStatus = useJourneyStore((s) => s.speechStatus)
  const silenceDuration = useJourneyStore((s) => s.silenceDuration)
  const prevStatusRef = useRef(speechStatus)

  // Restore stage rate the moment speech resumes
  useEffect(() => {
    if (speechStatus === 'listening' && prevStatusRef.current !== 'listening') {
      const { setVideoPlaybackRate, stage } = useJourneyStore.getState()
      setVideoPlaybackRate(STAGE_RATES[stage])
    }
    prevStatusRef.current = speechStatus
  }, [speechStatus])

  // Ease-out curve: starts at full stage rate, smoothly reaches MIN_RATE after 30s
  useEffect(() => {
    if (speechStatus !== 'silent') return
    const { setVideoPlaybackRate, stage } = useJourneyStore.getState()

    const stageRate = STAGE_RATES[stage]
    const elapsed = Math.max(0, silenceDuration - SILENCE_TRIGGER_S)
    const progress = Math.min(elapsed / SLOWDOWN_DURATION_S, 1)
    // Ease-out quad: decelerates quickly at first then flattens
    const eased = 1 - (1 - progress) * (1 - progress)
    const rate = stageRate + (MIN_RATE - stageRate) * eased

    setVideoPlaybackRate(rate)
  }, [silenceDuration, speechStatus])
}
