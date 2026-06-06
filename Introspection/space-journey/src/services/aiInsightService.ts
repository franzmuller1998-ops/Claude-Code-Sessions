import Anthropic from '@anthropic-ai/sdk'
import { useJourneyStore } from '../store/useJourneyStore'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export type InsightType =
  | 'new_idea'
  | 'reflection'
  | 'deep_question'
  | 'topic_change'
  | 'curiosity'
  | 'none'

export interface InsightResult {
  type: InsightType
  intensity: number // 0-1
  atmosphericText?: string
  discoveryLabel?: string
  discoveryIcon?: string
}

const DISCOVERY_POOL = [
  { label: 'Patience', icon: '📍' },
  { label: 'Courage', icon: '📍' },
  { label: 'Curiosity', icon: '📍' },
  { label: 'Gratitude', icon: '📍' },
  { label: 'Resilience', icon: '📍' },
  { label: 'Wonder', icon: '📍' },
  { label: 'Clarity', icon: '📍' },
  { label: 'Presence', icon: '📍' },
]

const ATMOSPHERIC_TEXTS = [
  "We're passing over the Atlantic. Many long journeys cross these waters.",
  'Night falls over Europe.',
  'The horizon grows brighter.',
  'Somewhere below, a city stirs awake.',
  'The terminator line marks dawn across a continent.',
  'Oceans hold more silence than we know.',
]

let lastAnalysisTime = 0
let lastDiscoveryTime = 0
let analysisBuffer = ''
let previousTopics: string[] = []
const ANALYSIS_INTERVAL = 30000 // 30 seconds
const DISCOVERY_COOLDOWN = 120000 // 2 minutes
const MIN_WORDS_FOR_ANALYSIS = 40

export async function analyzeConversation(transcript: string): Promise<InsightResult | null> {
  const now = Date.now()
  if (now - lastAnalysisTime < ANALYSIS_INTERVAL) return null

  const wordCount = transcript.trim().split(/\s+/).length
  if (wordCount < MIN_WORDS_FOR_ANALYSIS) return null

  // Only analyze new content
  const newContent = transcript.slice(analysisBuffer.length)
  if (newContent.trim().split(/\s+/).length < 15) return null

  lastAnalysisTime = now
  analysisBuffer = transcript

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: `You analyze spoken conversation excerpts from a quiet, reflective space journey app.
Detect the nature of what was said in 1-2 words. Reply ONLY with valid JSON — no prose.`,
      messages: [
        {
          role: 'user',
          content: `Recent speech: "${newContent.slice(-500)}"
Previous topics: ${previousTopics.slice(-3).join(', ') || 'none'}

Reply with JSON only:
{
  "type": "new_idea"|"reflection"|"deep_question"|"topic_change"|"curiosity"|"none",
  "intensity": 0.0-1.0,
  "currentTopic": "one word",
  "atmosphericText": "optional short poetic observation about space/earth, or null",
  "triggerDiscovery": true|false
}`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (parsed.currentTopic) {
      previousTopics.push(parsed.currentTopic)
      if (previousTopics.length > 10) previousTopics.shift()
    }

    const result: InsightResult = {
      type: parsed.type || 'none',
      intensity: Math.min(1, Math.max(0, parsed.intensity || 0)),
      atmosphericText: parsed.atmosphericText || undefined,
    }

    // Maybe surface a discovery
    if (
      parsed.triggerDiscovery &&
      now - lastDiscoveryTime > DISCOVERY_COOLDOWN &&
      parsed.intensity > 0.5
    ) {
      const discovery = DISCOVERY_POOL[Math.floor(Math.random() * DISCOVERY_POOL.length)]
      result.discoveryLabel = discovery.label
      result.discoveryIcon = discovery.icon
      lastDiscoveryTime = now
    }

    return result
  } catch {
    // Silently fail — AI is enhancement, not core
    return null
  }
}

export function getRandomAtmosphericText(): string {
  return ATMOSPHERIC_TEXTS[Math.floor(Math.random() * ATMOSPHERIC_TEXTS.length)]
}

// Hook that drives periodic AI analysis
export function startInsightEngine() {
  const interval = setInterval(async () => {
    const { transcript, speechStatus, sessionDuration } = useJourneyStore.getState()
    if (speechStatus === 'idle' || sessionDuration < 30) return

    const result = await analyzeConversation(transcript)
    if (!result) return

    const store = useJourneyStore.getState()

    if (result.intensity > 0.4) {
      store.addInsightScore(Math.floor(result.intensity * 10))
    }

    if (result.atmosphericText) {
      store.setAtmosphericMessage(result.atmosphericText, 7000)
    } else if (Math.random() < 0.08) {
      store.setAtmosphericMessage(getRandomAtmosphericText(), 6000)
    }

    if (result.discoveryLabel) {
      store.addDiscovery({
        label: result.discoveryLabel,
        icon: result.discoveryIcon || '📍',
      })
    }
  }, ANALYSIS_INTERVAL)

  return () => clearInterval(interval)
}
