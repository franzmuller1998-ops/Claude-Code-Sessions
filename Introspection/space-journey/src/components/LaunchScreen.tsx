import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onBegin: () => void
}

export default function LaunchScreen({ onBegin }: Props) {
  const [requesting, setRequesting] = useState(false)
  const [denied, setDenied] = useState(false)

  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const handleBegin = async () => {
    setRequesting(true)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      onBegin()
    } catch {
      setDenied(true)
      setRequesting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.8, ease: 'easeInOut' } }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(10, 12, 34, 0.97) 0%, rgba(2, 2, 10, 0.99) 100%)',
      }}
    >
      {/* Decorative rings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.07, scale: 1 }}
        transition={{ delay: 0.2, duration: 2.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 'min(58vw, 58vh)',
          height: 'min(58vw, 58vh)',
          borderRadius: '50%',
          border: '1px solid rgba(150, 180, 255, 1)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.035, scale: 1.25 }}
        transition={{ delay: 0.5, duration: 2.8, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 'min(80vw, 80vh)',
          height: 'min(80vw, 80vh)',
          borderRadius: '50%',
          border: '1px solid rgba(150, 180, 255, 1)',
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 1.4, ease: 'easeOut' }}
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
          letterSpacing: '0.48em',
          textTransform: 'uppercase',
          color: 'rgba(205, 218, 255, 0.88)',
          marginBottom: '0.8rem',
          textShadow: '0 0 60px rgba(100, 150, 255, 0.22)',
          fontWeight: 'normal',
        }}
      >
        Space Journey
      </motion.h1>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.1, duration: 0.9, ease: 'easeOut' }}
        style={{
          width: '56px',
          height: '1px',
          background: 'rgba(150, 180, 255, 0.22)',
          marginBottom: '1.6rem',
        }}
      />

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1.6 }}
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(0.7rem, 1.4vw, 0.88rem)',
          fontStyle: 'italic',
          color: 'rgba(150, 170, 215, 0.48)',
          letterSpacing: '0.08em',
          marginBottom: '3.2rem',
          textAlign: 'center',
          lineHeight: 1.85,
        }}
      >
        Speak your thoughts into the void.
        <br />
        Watch the universe respond.
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.9 }}
        whileHover={requesting ? {} : { scale: 1.04 }}
        whileTap={requesting ? {} : { scale: 0.96 }}
        onClick={handleBegin}
        disabled={requesting}
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.78rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: requesting
            ? 'rgba(140, 160, 210, 0.3)'
            : 'rgba(195, 212, 255, 0.82)',
          background: 'transparent',
          border: `1px solid ${requesting ? 'rgba(140, 170, 255, 0.1)' : 'rgba(140, 170, 255, 0.22)'}`,
          borderRadius: '50px',
          padding: '13px 44px',
          cursor: requesting ? 'default' : 'pointer',
          backdropFilter: 'blur(8px)',
          outline: 'none',
          transition: 'color 0.4s, border-color 0.4s',
        }}
      >
        {requesting ? 'Preparing…' : 'Begin your journey'}
      </motion.button>

      {/* Mic denied */}
      {denied && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '1.6rem',
            fontFamily: 'Georgia, serif',
            fontSize: '0.72rem',
            color: 'rgba(255, 140, 140, 0.62)',
            textAlign: 'center',
            lineHeight: 1.65,
          }}
        >
          Microphone access is required for the journey.
          <br />
          Allow it in your browser settings and try again.
        </motion.p>
      )}

      {/* Speech API not supported */}
      {!speechSupported && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 1.2 }}
          style={{
            position: 'absolute',
            bottom: '2rem',
            fontFamily: 'Georgia, serif',
            fontSize: '0.68rem',
            color: 'rgba(255, 195, 130, 0.48)',
            textAlign: 'center',
            lineHeight: 1.65,
          }}
        >
          Speech recognition isn&apos;t available in this browser.
          <br />
          Use Chrome or Edge for the full experience.
        </motion.p>
      )}
    </motion.div>
  )
}
