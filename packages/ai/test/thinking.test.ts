import type { Model } from '../src/catalog/types'
import { describe, expect, it } from 'vitest'
import { clampThinkingLevel, supportedThinkingLevels, THINKING_LEVELS } from '../src/catalog/thinking'

const base: Model = { id: 'm', name: 'm', provider: 'p', input: ['text'], reasoning: true }

describe('thinking levels', () => {
  it('lists seven levels in strength order', () => {
    expect(THINKING_LEVELS).toEqual(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  })

  it('offers only off for a model without reasoning', () => {
    expect(supportedThinkingLevels({ ...base, reasoning: false })).toEqual(['off'])
    expect(supportedThinkingLevels(undefined)).toEqual(['off'])
  })

  it('offers every level for a reasoning model without an explicit list', () => {
    expect(supportedThinkingLevels(base)).toEqual(THINKING_LEVELS)
  })

  it('clamps down to the nearest supported level, and never above off', () => {
    const m: Model = { ...base, thinkingLevels: ['off', 'medium'] }
    expect(clampThinkingLevel(m, 'xhigh')).toBe('medium')
    expect(clampThinkingLevel(m, 'low')).toBe('off')
    expect(clampThinkingLevel(m, 'medium')).toBe('medium')
  })

  it('clamps up to the floor when a model cannot be switched off', () => {
    const fable: Model = { ...base, thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'] }
    expect(clampThinkingLevel(fable, 'off')).toBe('low')
    expect(clampThinkingLevel(fable, 'minimal')).toBe('low')
  })
})
