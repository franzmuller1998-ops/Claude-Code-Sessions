import { create } from 'zustand'

export type Stage = 'LAUNCH' | 'ORBIT' | 'DEEP_SPACE'
export type SpeechStatus = 'idle' | 'listening' | 'silent'

export interface Discovery {
  id: string
  label: string
  icon: string
  timestamp: number
}

export interface Achievement {
  id: string
  title: string
  icon: string
  description: string
  unlockedAt: number
}

export interface WordObject {
  id: string
  word: string
  type: 'star' | 'comet' | 'constellation'
  x: number
  y: number
  createdAt: number
}

export interface AtmosphericMessage {
  id: string
  text: string
  expiresAt: number
}

interface JourneyState {
  stage: Stage
  speechStatus: SpeechStatus
  wordCount: number
  sessionStartTime: number | null
  sessionDuration: number
  videoPlaybackRate: number
  discoveries: Discovery[]
  achievements: Achievement[]
  wordObjects: WordObject[]
  atmosphericMessage: AtmosphericMessage | null
  transcript: string
  interimTranscript: string
  silenceDuration: number
  insightScore: number

  // Actions
  startSession: () => void
  advanceStage: (stage: Stage) => void
  setSpeechStatus: (status: SpeechStatus) => void
  setTranscript: (text: string, interim: string) => void
  addWords: (count: number) => void
  setVideoPlaybackRate: (rate: number) => void
  addDiscovery: (discovery: Omit<Discovery, 'id' | 'timestamp'>) => void
  unlockAchievement: (achievement: Omit<Achievement, 'id' | 'unlockedAt'>) => void
  addWordObject: (obj: Omit<WordObject, 'id' | 'createdAt'>) => void
  removeWordObject: (id: string) => void
  setAtmosphericMessage: (text: string, duration?: number) => void
  clearAtmosphericMessage: () => void
  setSilenceDuration: (seconds: number) => void
  addInsightScore: (amount: number) => void
  tick: () => void
}

const STAGE_PLAYBACK: Record<Stage, number> = {
  LAUNCH: 0.5,
  ORBIT: 1.0,
  DEEP_SPACE: 1.5,
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  stage: 'LAUNCH',
  speechStatus: 'idle',
  wordCount: 0,
  sessionStartTime: null,
  sessionDuration: 0,
  videoPlaybackRate: 0.3,
  discoveries: [],
  achievements: [],
  wordObjects: [],
  atmosphericMessage: null,
  transcript: '',
  interimTranscript: '',
  silenceDuration: 0,
  insightScore: 0,

  startSession: () => set({ sessionStartTime: Date.now(), videoPlaybackRate: 0.4 }),

  advanceStage: (stage) =>
    set({ stage, videoPlaybackRate: STAGE_PLAYBACK[stage] }),

  setSpeechStatus: (speechStatus) => {
    const updates: Partial<JourneyState> = { speechStatus }
    if (speechStatus === 'listening') {
      const { stage, videoPlaybackRate } = get()
      // Ensure playback rate picks up when listening resumes
      if (videoPlaybackRate < STAGE_PLAYBACK[stage]) {
        updates.videoPlaybackRate = STAGE_PLAYBACK[stage]
      }
    }
    set(updates)
  },

  setTranscript: (transcript, interimTranscript) =>
    set({ transcript, interimTranscript }),

  addWords: (count) =>
    set((s) => ({ wordCount: s.wordCount + count })),

  setVideoPlaybackRate: (videoPlaybackRate) => set({ videoPlaybackRate }),

  addDiscovery: (discovery) => {
    const { discoveries } = get()
    const newDiscovery: Discovery = {
      ...discovery,
      id: `d-${Date.now()}`,
      timestamp: Date.now(),
    }
    const updated = [...discoveries, newDiscovery].slice(-20)
    try {
      localStorage.setItem('sj_discoveries', JSON.stringify(updated))
    } catch {}
    set({ discoveries: updated })
  },

  unlockAchievement: (achievement) => {
    const { achievements } = get()
    if (achievements.find((a) => a.title === achievement.title)) return
    const newAchievement: Achievement = {
      ...achievement,
      id: `a-${Date.now()}`,
      unlockedAt: Date.now(),
    }
    const updated = [...achievements, newAchievement]
    try {
      localStorage.setItem('sj_achievements', JSON.stringify(updated))
    } catch {}
    set({ achievements: updated })
  },

  addWordObject: (obj) =>
    set((s) => ({
      wordObjects: [
        ...s.wordObjects,
        { ...obj, id: `wo-${Date.now()}-${Math.random()}`, createdAt: Date.now() },
      ].slice(-12),
    })),

  removeWordObject: (id) =>
    set((s) => ({ wordObjects: s.wordObjects.filter((w) => w.id !== id) })),

  setAtmosphericMessage: (text, duration = 6000) => {
    const msg: AtmosphericMessage = {
      id: `am-${Date.now()}`,
      text,
      expiresAt: Date.now() + duration,
    }
    set({ atmosphericMessage: msg })
  },

  clearAtmosphericMessage: () => set({ atmosphericMessage: null }),

  setSilenceDuration: (silenceDuration) => set({ silenceDuration }),

  addInsightScore: (amount) =>
    set((s) => ({ insightScore: s.insightScore + amount })),

  tick: () => {
    const { sessionStartTime } = get()
    if (sessionStartTime) {
      set({ sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000) })
    }
  },
}))

// Hydrate persisted data on load
try {
  const savedDiscoveries = localStorage.getItem('sj_discoveries')
  const savedAchievements = localStorage.getItem('sj_achievements')
  if (savedDiscoveries)
    useJourneyStore.setState({ discoveries: JSON.parse(savedDiscoveries) })
  if (savedAchievements)
    useJourneyStore.setState({ achievements: JSON.parse(savedAchievements) })
} catch {}
