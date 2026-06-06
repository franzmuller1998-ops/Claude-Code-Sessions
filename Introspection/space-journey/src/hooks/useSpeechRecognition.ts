import { useEffect, useRef, useCallback, useState } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'

const SILENCE_THRESHOLD_MS = 8000
// A pause of this length before new speech clears the previous sentence
const PAUSE_RESET_MS = 3000

interface SpeechHook {
  isListening: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
}

// Augment window type for webkit
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export function useSpeechRecognition(): SpeechHook {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isListening, setIsListening] = useState(false)
  const isListeningRef = useRef(false)

  const { setSpeechStatus, setTranscript, addWords, setSilenceDuration } =
    useJourneyStore.getState()

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current)
    silenceStartRef.current = null
    setSilenceDuration(0)
  }, [setSilenceDuration])

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceStartRef.current = Date.now()

    silenceIntervalRef.current = setInterval(() => {
      if (silenceStartRef.current) {
        const elapsed = (Date.now() - silenceStartRef.current) / 1000
        setSilenceDuration(Math.floor(elapsed))
      }
    }, 1000)

    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        useJourneyStore.getState().setSpeechStatus('silent')
      }
    }, SILENCE_THRESHOLD_MS)
  }, [clearSilenceTimer, setSilenceDuration])

  const initRecognition = useCallback(() => {
    if (!isSupported) return null

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.maxAlternatives = 1

    let finalBuffer = ''
    let lastActivityTime = 0

    rec.onstart = () => {
      setIsListening(true)
      isListeningRef.current = true
      setSpeechStatus('listening')
      startSilenceTimer()
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // If the user paused for 3s+ and is now speaking again, start a fresh
      // sentence — drop the previously displayed words entirely.
      const now = Date.now()
      if (lastActivityTime && now - lastActivityTime >= PAUSE_RESET_MS) {
        finalBuffer = ''
      }
      lastActivityTime = now

      let interim = ''
      let newFinal = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (newFinal) {
        finalBuffer += newFinal
        const words = newFinal.trim().split(/\s+/).filter(Boolean).length
        addWords(words)
        clearSilenceTimer()
        startSilenceTimer()
        setSpeechStatus('listening')
      }

      setTranscript(finalBuffer, interim)
    }

    rec.onspeechend = () => {
      startSilenceTimer()
    }

    rec.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListeningRef.current) {
        try { rec.start() } catch {}
      } else {
        setIsListening(false)
        setSpeechStatus('idle')
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        isListeningRef.current = false
        setIsListening(false)
        setSpeechStatus('idle')
      }
      // For other errors (network, aborted), onend will restart
    }

    return rec
  }, [isSupported, setSpeechStatus, setTranscript, addWords, startSilenceTimer, clearSilenceTimer])

  const start = useCallback(() => {
    if (!isSupported || isListeningRef.current) return
    const rec = initRecognition()
    if (!rec) return
    recognitionRef.current = rec
    isListeningRef.current = true
    try { rec.start() } catch {}
  }, [isSupported, initRecognition])

  const stop = useCallback(() => {
    isListeningRef.current = false
    clearSilenceTimer()
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setSpeechStatus('idle')
    setSilenceDuration(0)
  }, [clearSilenceTimer, setSpeechStatus, setSilenceDuration])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      clearSilenceTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [clearSilenceTimer])

  return { isListening, isSupported, start, stop }
}
