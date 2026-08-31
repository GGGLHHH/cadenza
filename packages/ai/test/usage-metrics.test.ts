// @vitest-environment node
import type { Model, TokenUsage } from '../src/catalog/types'
import { describe, expect, it } from 'vitest'
import { usageMetrics } from '../src/catalog/usage-metrics'

const model: Model = {
  id: 'm',
  name: 'm',
  provider: 'p',
  input: ['text'],
  reasoning: true,
  contextWindow: 100_000,
  cost: { input: 1, output: 2, cacheRead: 0.1 },
}

const usage: TokenUsage = {
  promptTokens: 10_000,
  completionTokens: 2_000,
  totalTokens: 12_000,
  promptTokensDetails: { cachedTokens: 6_000, cacheWriteTokens: 1_000, textTokens: 8_000, imageTokens: 2_000 },
  completionTokensDetails: { reasoningTokens: 800 },
}

describe('usageMetrics', () => {
  it('derives every ratio from one usage', () => {
    const m = usageMetrics(usage, model)
    expect(m.cacheHitRate).toBeCloseTo(0.6, 10)
    expect(m.cacheWriteRate).toBeCloseTo(0.1, 10)
    expect(m.outputRatio).toBeCloseTo(0.2, 10)
    expect(m.reasoningShare).toBeCloseTo(0.4, 10)
    expect(m.contextRatio).toBeCloseTo(0.1, 10)
    // 6000 cached tokens at 0.1 instead of 1.0 per million.
    expect(m.cacheSavings).toBeCloseTo((6_000 * 0.9) / 1_000_000, 10)
  })

  it('reports an unknown rate as undefined, never as zero', () => {
    // A rate with no denominator is not 0% — the caller must be able to tell
    // "nothing cached" from "this provider says nothing about caching".
    const empty = usageMetrics({ promptTokens: 0, completionTokens: 0, totalTokens: 0 })
    expect(empty.cacheHitRate).toBeUndefined()
    expect(empty.outputRatio).toBeUndefined()
    expect(empty.reasoningShare).toBeUndefined()
    expect(empty.contextRatio).toBeUndefined()
    expect(empty.cacheSavings).toBeUndefined()
    // A model with a window but no prices: the window ratio still resolves.
    const noPrice = usageMetrics(usage, { ...model, cost: undefined })
    expect(noPrice.contextRatio).toBeCloseTo(0.1, 10)
    expect(noPrice.cacheSavings).toBeUndefined()
    // Priced, but the vendor does not discount cache reads: unknown, not zero.
    expect(usageMetrics(usage, { ...model, cost: { input: 1, output: 2 } }).cacheSavings).toBeUndefined()
  })

  it('lists only the modalities present, largest first', () => {
    const m = usageMetrics(usage, model)
    expect(m.promptModalities.map(s => [s.kind, s.tokens])).toEqual([['text', 8_000], ['image', 2_000]])
    expect(m.promptModalities[0]?.share).toBeCloseTo(0.8, 10)
    // No completion modalities were reported, so there is nothing to slice.
    expect(m.completionModalities).toEqual([])
  })

  it('needs no model at all for the four ratios that do not depend on one', () => {
    const m = usageMetrics(usage)
    expect(m.cacheHitRate).toBeCloseTo(0.6, 10)
    expect(m.outputRatio).toBeCloseTo(0.2, 10)
    expect(m.reasoningShare).toBeCloseTo(0.4, 10)
    expect(m.contextRatio).toBeUndefined()
  })
})
