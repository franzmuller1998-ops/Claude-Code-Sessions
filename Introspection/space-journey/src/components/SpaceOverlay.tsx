import { useEffect, useRef, useCallback } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'
import type { Stage, WordObject } from '../store/useJourneyStore'

interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  twinkleSpeed: number
  twinkleOffset: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  radius: number
  hue: number
}

interface NebulaPoint {
  x: number
  y: number
  radius: number
  hue: number
  opacity: number
}

const STAR_COUNTS: Record<Stage, number> = {
  LAUNCH: 80,
  ORBIT: 180,
  DEEP_SPACE: 380,
}

// Temporarily disable the starfield. Flip back to true to restore stars.
const STARS_ENABLED = false

function buildStars(count: number, w: number, h: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinkleOffset: Math.random() * Math.PI * 2,
  }))
}

function buildNebula(w: number, h: number): NebulaPoint[] {
  return Array.from({ length: 6 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 200 + 100,
    hue: Math.random() * 60 + 220,
    opacity: Math.random() * 0.12 + 0.04,
  }))
}

export default function SpaceOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const nebulaRef = useRef<NebulaPoint[]>([])
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const stageRef = useRef<Stage>('LAUNCH')
  const wordObjectsRef = useRef<WordObject[]>([])
  const listeningRef = useRef(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w
    canvas.height = h
    starsRef.current = buildStars(STAR_COUNTS[stageRef.current], w, h)
    nebulaRef.current = buildNebula(w, h)
  }, [])

  useEffect(() => {
    initCanvas()
    window.addEventListener('resize', initCanvas)
    return () => window.removeEventListener('resize', initCanvas)
  }, [initCanvas])

  // Subscribe to store changes without causing re-renders
  useEffect(() => {
    const unsub = useJourneyStore.subscribe((state) => {
      const prevStage = stageRef.current
      stageRef.current = state.stage
      listeningRef.current = state.speechStatus === 'listening'
      wordObjectsRef.current = state.wordObjects

      if (prevStage !== state.stage) {
        const canvas = canvasRef.current
        if (!canvas) return
        const target = STAR_COUNTS[state.stage]
        const current = starsRef.current.length
        if (target > current) {
          const extra = buildStars(
            target - current,
            canvas.width,
            canvas.height
          )
          starsRef.current = [...starsRef.current, ...extra]
        }
        if (state.stage === 'DEEP_SPACE') {
          nebulaRef.current = buildNebula(canvas.width, canvas.height)
        }
      }
    })
    return unsub
  }, [])

  // Spawn particles on speech activity
  useEffect(() => {
    const unsub = useJourneyStore.subscribe((state) => {
      if (state.speechStatus !== 'listening') return
      if (Math.random() > 0.3) return
      const canvas = canvasRef.current
      if (!canvas) return
      particlesRef.current.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height * 0.6 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2 - 0.3,
        life: 1,
        maxLife: Math.random() * 80 + 40,
        radius: Math.random() * 2 + 0.5,
        hue: Math.random() * 60 + 180,
      })
    })
    return unsub
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (timestamp: number) => {
      timeRef.current = timestamp
      const t = timestamp * 0.001
      const { width: w, height: h } = canvas
      const stage = stageRef.current

      ctx.clearRect(0, 0, w, h)

      // Draw nebula (DEEP_SPACE only)
      if (stage === 'DEEP_SPACE') {
        for (const n of nebulaRef.current) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius)
          grad.addColorStop(0, `hsla(${n.hue}, 70%, 60%, ${n.opacity})`)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw stars
      if (STARS_ENABLED) {
        for (const star of starsRef.current) {
          const twinkle = Math.sin(t * star.twinkleSpeed * 60 + star.twinkleOffset)
          const alpha = star.opacity + twinkle * 0.15
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, alpha)})`
          ctx.fill()
        }
      }

      // Draw word objects
      for (const obj of wordObjectsRef.current) {
        const age = (Date.now() - obj.createdAt) / 1000
        const life = Math.max(0, 1 - age / 8)
        if (life <= 0) continue

        ctx.save()
        ctx.globalAlpha = life

        if (obj.type === 'star') {
          const glow = ctx.createRadialGradient(obj.x, obj.y, 0, obj.x, obj.y, 20)
          glow.addColorStop(0, 'rgba(255,240,120,0.9)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(obj.x, obj.y, 20, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,200,0.95)'
          ctx.beginPath()
          ctx.arc(obj.x, obj.y, 3, 0, Math.PI * 2)
          ctx.fill()
        } else if (obj.type === 'comet') {
          ctx.strokeStyle = 'rgba(180,220,255,0.8)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(obj.x - 40, obj.y + 20)
          ctx.lineTo(obj.x + 4, obj.y)
          ctx.stroke()
          ctx.fillStyle = 'rgba(220,240,255,0.95)'
          ctx.beginPath()
          ctx.arc(obj.x + 4, obj.y, 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (obj.type === 'constellation') {
          const pts = [
            [obj.x - 20, obj.y - 20],
            [obj.x + 20, obj.y - 10],
            [obj.x, obj.y + 20],
            [obj.x - 10, obj.y],
          ]
          ctx.strokeStyle = 'rgba(150,180,255,0.5)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          pts.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.closePath()
          ctx.stroke()
          for (const [px, py] of pts) {
            ctx.fillStyle = 'rgba(200,220,255,0.9)'
            ctx.beginPath()
            ctx.arc(px, py, 2.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // Word label
        ctx.font = '11px Georgia, serif'
        ctx.fillStyle = `rgba(220,230,255,${life * 0.7})`
        ctx.textAlign = 'center'
        ctx.fillText(obj.word, obj.x, obj.y + 28)
        ctx.restore()
      }

      // Draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= 1
        if (p.life <= 0) return false
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.01
        const alpha = (p.life / p.maxLife) * 0.6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},80%,80%,${alpha})`
        ctx.fill()
        return true
      })

      frameRef.current = requestAnimationFrame(render)
    }

    frameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}
