import { useEffect, useRef, useState, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useJourneyStore } from './store/useJourneyStore'
import VideoBackground from './components/VideoBackground'
import SpaceOverlay from './components/SpaceOverlay'
import TranscriptDisplay from './components/TranscriptDisplay'
import AtmosphericText from './components/AtmosphericText'
import DiscoveryToast from './components/DiscoveryToast'
import AchievementUnlock from './components/AchievementUnlock'
import LaunchScreen from './components/LaunchScreen'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useSilenceMode } from './hooks/useSilenceMode'
import { startInsightEngine } from './services/aiInsightService'
import { startAchievementEngine } from './services/achievementEngine'

// Session duration thresholds for stage advances (seconds)
const ORBIT_AT = 60
const DEEP_SPACE_AT = 240

// Memoized static-layout components — no props, no re-render unless their
// own Zustand subscriptions fire.
const MemoVideo = memo(VideoBackground)
const MemoCanvas = memo(SpaceOverlay)
const MemoTranscript = memo(TranscriptDisplay)
const MemoAtmospheric = memo(AtmosphericText)
const MemoDiscovery = memo(DiscoveryToast)
const MemoAchievement = memo(AchievementUnlock)

export default function App() {
  const [sessionStarted, setSessionStarted] = useState(false)
  const enginesRef = useRef(false)

  const { start: startSpeech } = useSpeechRecognition()
  useSilenceMode()

  // Tick the session clock without subscribing sessionDuration to React
  useEffect(() => {
    if (!sessionStarted) return
    const id = setInterval(() => useJourneyStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [sessionStarted])

  // Stage transitions via subscribe — no React re-render per tick
  useEffect(() => {
    if (!sessionStarted) return
    const unsub = useJourneyStore.subscribe((state) => {
      const { stage, sessionDuration } = state
      if (stage === 'LAUNCH' && sessionDuration >= ORBIT_AT) {
        useJourneyStore.getState().advanceStage('ORBIT')
        useJourneyStore.getState().setAtmosphericMessage('Entering orbit…', 5000)
      } else if (stage === 'ORBIT' && sessionDuration >= DEEP_SPACE_AT) {
        useJourneyStore.getState().advanceStage('DEEP_SPACE')
        useJourneyStore.getState().setAtmosphericMessage('Drifting into the deep…', 5000)
      }
    })
    return unsub
  }, [sessionStarted])

  const handleBegin = () => {
    useJourneyStore.getState().startSession()
    startSpeech()
    if (!enginesRef.current) {
      enginesRef.current = true
      startInsightEngine()
      startAchievementEngine()
    }
    setSessionStarted(true)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* z-index 0 — background video */}
      <MemoVideo />
      {/* z-index 2 — canvas particles / stars */}
      <MemoCanvas />
      {/* z-index 10 — live transcript */}
      <MemoTranscript />
      {/* z-index 12 — cinematic atmospheric text */}
      <MemoAtmospheric />
      {/* z-index 20 — popup notifications */}
      <MemoDiscovery />
      <MemoAchievement />
      {/* z-index 30 — minimal HUD */}
      {sessionStarted && <SessionHUD />}
      {/* z-index 50 — launch gate (fades away on begin) */}
      <AnimatePresence>
        {!sessionStarted && <LaunchScreen key="launch" onBegin={handleBegin} />}
      </AnimatePresence>
    </div>
  )
}

// Subscribes to sessionDuration (ticks every second) and stage (rare) in isolation
// so the parent App component is never re-rendered by these changes.
function SessionHUD() {
  const stage = useJourneyStore((s) => s.stage)
  const sessionDuration = useJourneyStore((s) => s.sessionDuration)

  const mm = String(Math.floor(sessionDuration / 60)).padStart(2, '0')
  const ss = String(sessionDuration % 60).padStart(2, '0')

  const stageLabel: Record<string, string> = {
    LAUNCH: 'Launch',
    ORBIT: 'Orbit',
    DEEP_SPACE: 'Deep Space',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '1.75rem',
        zIndex: 30,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <span
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.56rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(140, 170, 255, 0.35)',
        }}
      >
        {stageLabel[stage]}
      </span>
      <span
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          color: 'rgba(140, 170, 255, 0.28)',
        }}
      >
        {mm}:{ss}
      </span>
    </div>
  )
}
