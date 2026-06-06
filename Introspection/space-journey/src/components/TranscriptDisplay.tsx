import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJourneyStore } from '../store/useJourneyStore'
import { classifyWords } from '../services/wordClassifier'

export default function TranscriptDisplay() {
  const transcript = useJourneyStore((s) => s.transcript)
  const interimTranscript = useJourneyStore((s) => s.interimTranscript)
  const addWordObject = useJourneyStore((s) => s.addWordObject)
  const prevTranscriptRef = useRef('')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [shown, setShown] = useState(false)

  // Bold = finalized words; dim = current interim. They never overlap.
  const finalTail = transcript.slice(-80).trim().split(' ').slice(-8).join(' ')
  const interimTail = interimTranscript.trim().slice(-40)
  const hasContent = Boolean(finalTail || interimTail)

  // Reset a 1.5s timer on every new word; fully fade out once speech stops
  useEffect(() => {
    if (!hasContent) return
    setShown(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShown(false), 1500)
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [transcript, interimTranscript, hasContent])

  // Word-to-visual classification (unchanged)
  useEffect(() => {
    const prev = prevTranscriptRef.current
    // After a pause-reset the buffer restarts, so it's no longer a prefix
    // continuation — classify the whole new string in that case.
    const newPart = transcript.startsWith(prev) ? transcript.slice(prev.length) : transcript
    prevTranscriptRef.current = transcript
    if (!newPart.trim()) return
    const matches = classifyWords(newPart)
    for (const match of matches) {
      addWordObject({
        word: match.word,
        type: match.type,
        x: Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2,
        y: Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1,
      })
    }
  }, [transcript, addWordObject])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <AnimatePresence>
        {shown && hasContent && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.8, ease: 'easeOut' } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ textAlign: 'center', maxWidth: '60vw', padding: '0 2rem' }}
          >
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)',
                fontWeight: 300,
                color: 'rgba(210, 225, 255, 0.92)',
                letterSpacing: '0.04em',
                lineHeight: 1.5,
                textShadow:
                  '0 0 40px rgba(100,150,255,0.4), 0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {finalTail}
              {interimTail && (
                <span style={{ color: 'rgba(180,200,255,0.55)' }}>
                  {finalTail ? ' ' : ''}
                  {interimTail}
                </span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
