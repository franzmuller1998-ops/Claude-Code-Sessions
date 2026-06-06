import { useJourneyStore } from '../store/useJourneyStore'

interface AchievementDef {
  title: string
  icon: string
  description: string
  check: () => boolean
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    title: 'First Words',
    icon: '⭐',
    description: 'Spoke your first 500 words into the cosmos.',
    check: () => useJourneyStore.getState().wordCount >= 500,
  },
  {
    title: 'Deep Traveler',
    icon: '🌕',
    description: 'Completed a 20-minute session.',
    check: () => useJourneyStore.getState().sessionDuration >= 1200,
  },
  {
    title: 'Stillness',
    icon: '🌌',
    description: 'Held silence for 30 seconds.',
    check: () => useJourneyStore.getState().silenceDuration >= 30,
  },
  {
    title: 'Orbit Reached',
    icon: '🛰️',
    description: 'Entered the orbital stage.',
    check: () =>
      useJourneyStore.getState().stage === 'ORBIT' ||
      useJourneyStore.getState().stage === 'DEEP_SPACE',
  },
  {
    title: 'Deep Space',
    icon: '☄️',
    description: 'Journeyed into deep space.',
    check: () => useJourneyStore.getState().stage === 'DEEP_SPACE',
  },
  {
    title: 'Wanderer',
    icon: '✨',
    description: 'Spoke 2000 words across the void.',
    check: () => useJourneyStore.getState().wordCount >= 2000,
  },
]

const checkedRef = new Set<string>()

export function checkAchievements() {
  const store = useJourneyStore.getState()
  const unlockedTitles = new Set(store.achievements.map((a) => a.title))

  for (const def of ACHIEVEMENTS) {
    if (unlockedTitles.has(def.title)) continue
    if (checkedRef.has(def.title)) {
      try {
        if (def.check()) {
          checkedRef.delete(def.title)
          store.unlockAchievement({
            title: def.title,
            icon: def.icon,
            description: def.description,
          })
        }
      } catch {}
    } else {
      checkedRef.add(def.title)
    }
  }
}

export function startAchievementEngine() {
  // Check achievements on every store change
  const unsub = useJourneyStore.subscribe(() => {
    checkAchievements()
  })
  return unsub
}
