import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useJourneyStore } from '../store/useJourneyStore'
import type { Discovery } from '../store/useJourneyStore'

export default function DiscoveryToast() {
  const discoveries = useJourneyStore((s) => s.discoveries)
  const [visible, setVisible] = useState<Discovery | null>(null)
  const seenRef = useState<Set<string>>(() => new Set())[0]

  useEffect(() => {
    const latest = discoveries[discoveries.length - 1]
    if (!latest || seenRef.has(latest.id)) return
    seenRef.add(latest.id)
    setVisible(latest)
    const t = setTimeout(() => setVisible(null), 4500)
    return () => clearTimeout(t)
  }, [discoveries, seenRef])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(20, 20, 40, 0.7)',
              border: '1px solid rgba(200, 200, 255, 0.15)',
              borderRadius: '40px',
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{visible.icon}</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255, 215, 100, 0.9)',
            }}>
              Discovery: {visible.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
