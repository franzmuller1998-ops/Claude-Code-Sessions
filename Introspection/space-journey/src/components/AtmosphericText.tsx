import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJourneyStore } from '../store/useJourneyStore'

export default function AtmosphericText() {
  const message = useJourneyStore((s) => s.atmosphericMessage)
  const clearAtmosphericMessage = useJourneyStore((s) => s.clearAtmosphericMessage)

  useEffect(() => {
    if (!message) return
    const remaining = message.expiresAt - Date.now()
    if (remaining <= 0) {
      clearAtmosphericMessage()
      return
    }
    const t = setTimeout(clearAtmosphericMessage, remaining)
    return () => clearTimeout(t)
  }, [message, clearAtmosphericMessage])

  return (
    <div
      className="fixed bottom-16 left-0 right-0 flex justify-center pointer-events-none"
      style={{ zIndex: 12 }}
    >
      <AnimatePresence>
        {message && (
          <motion.p
            key={message.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(0.7rem, 1.4vw, 0.95rem)',
              fontStyle: 'italic',
              color: 'rgba(180, 200, 230, 0.55)',
              letterSpacing: '0.06em',
              textAlign: 'center',
              maxWidth: '50vw',
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
