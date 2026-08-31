import type { Model, TokenUsage } from '../src/catalog/types'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UsageStats } from '../src/view/usage-stats'

const model: Model = { id: 'm', name: 'M', provider: 'p', input: ['text'], reasoning: true, contextWindow: 100_000, cost: { input: 1, output: 2, cacheRead: 0.1 } }
const usage: TokenUsage = {
  promptTokens: 10_000,
  completionTokens: 2_000,
  totalTokens: 12_000,
  promptTokensDetails: { cachedTokens: 6_000, cacheWriteTokens: 1_000, textTokens: 8_000, imageTokens: 2_000 },
  completionTokensDetails: { reasoningTokens: 800 },
}

function tiles(container: HTMLElement): Array<[string, string]> {
  return [...container.querySelectorAll('[data-slot=usage-stat]')].map((tile) => {
    const label = tile.querySelector('dt')!.textContent ?? ''
    // The value span, not the whole dd — the bar and any breakdown live there too.
    return [label, tile.querySelector('dd > span')!.textContent ?? '']
  })
}

describe('usageStats', () => {
  it('renders one tile per known metric, with a bar for the rates', () => {
    const { container } = render(<UsageStats usage={usage} model={model} />)
    expect(tiles(container)).toEqual([
      ['Cache hit', '60%'],
      ['Cache write', '10%'],
      ['Out per in', '0.20×'],
      ['Reasoning', '40%'],
      ['Context used', '10%'],
      ['Saved by cache', '$0.0054'],
      ['Prompt by modality', '10000'],
    ])
    expect(container.querySelectorAll('[role=progressbar]')).toHaveLength(4)
  })

  it('skips a metric whose denominator is unknown rather than showing 0%', () => {
    // A provider that reports no cache detail and a model with no window: four
    // tiles disappear instead of four tiles reading zero.
    const { container } = render(<UsageStats usage={{ promptTokens: 100, completionTokens: 50, totalTokens: 150 }} />)
    expect(tiles(container)).toEqual([['Out per in', '0.50×']])
  })

  it('takes label overrides one key at a time', () => {
    const { container } = render(<UsageStats usage={usage} model={model} labels={{ cacheHit: '缓存命中' }} />)
    expect(tiles(container)[0]).toEqual(['缓存命中', '60%'])
    // The keys not named keep their defaults.
    expect(tiles(container)[1]?.[0]).toBe('Cache write')
  })

  it('breaks the prompt down by modality, largest first', () => {
    const { container } = render(<UsageStats usage={usage} model={model} />)
    const tile = [...container.querySelectorAll('[data-slot=usage-stat]')].find(t => t.querySelector('dt')?.textContent === 'Prompt by modality')!
    expect(tile.textContent).toContain('Text')
    expect(tile.textContent).toContain('80%')
    expect(tile.textContent).toContain('Image')
    expect(tile.textContent).toContain('20%')
  })
})
