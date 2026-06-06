import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJourneyStore } from '../store/useJourneyStore'
import type { Achievement } from '../store/useJourneyStore'

export default function AchievementUnlock() {
  const achievements = useJourneyStore((s) => s.achievements)
  const [visible, setVisible] = useState<Achievement | null>(null)
  const seenRef = useState<Set<string>>(() => new Set())[0]

  useEffect(() => {
    const latest = achievements[achievements.length - 1]
    if (!latest || seenRef.has(latest.id)) return
    seenRef.add(latest.id)
    setVisible(latest)
    const t = setTimeout(() => setVisible(null), 5000)
    return () => clearTimeout(t)
  }, [achievements, seenRef])

  return (
    <div className="fixed top-6 right-6 pointer-events-none" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: 'rgba(15, 15, 30, 0.75)',
              border: '1px solid rgba(150, 180, 255, 0.2)',
              borderRadius: '12px',
              padding: '14px 18px',
              maxWidth: '240px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>{visible.icon}</span>
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(180, 200, 255, 0.6)',
              }}>
                Achievement
              </span>
            </div>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.9rem',
              color: 'rgba(220, 230, 255, 0.9)',
              margin: 0,
            }}>
              {visible.title}
            </p>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.75rem',
              color: 'rgba(180, 200, 255, 0.5)',
              margin: '3px 0 0',
            }}>
              {visible.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
