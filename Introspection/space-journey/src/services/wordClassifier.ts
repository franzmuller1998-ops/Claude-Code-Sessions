import type { WordObject } from '../store/useJourneyStore'

type VisualType = WordObject['type']

const WORD_MAP: Record<string, VisualType> = {
  hope: 'star', light: 'star', love: 'star', peace: 'star', joy: 'star',
  wish: 'star', faith: 'star', truth: 'star', beauty: 'star', wonder: 'star',
  dream: 'comet', fly: 'comet', travel: 'comet', free: 'comet', swift: 'comet',
  journey: 'constellation', family: 'constellation', together: 'constellation',
  connect: 'constellation', path: 'constellation', story: 'constellation',
  memory: 'constellation', home: 'constellation', life: 'constellation',
}

// Track which words have fired recently to avoid spam
const recentlyFired = new Set<string>()

export function classifyWords(text: string): Array<{ word: string; type: VisualType }> {
  const words = text.toLowerCase().split(/\s+/)
  const results: Array<{ word: string; type: VisualType }> = []

  for (const raw of words) {
    const clean = raw.replace(/[^a-z]/g, '')
    if (!clean) continue
    const type = WORD_MAP[clean]
    if (type && !recentlyFired.has(clean)) {
      results.push({ word: raw, type })
      recentlyFired.add(clean)
      setTimeout(() => recentlyFired.delete(clean), 60000)
    }
  }

  return results
}
