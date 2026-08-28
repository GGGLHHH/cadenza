import { describe, expect, it } from 'vitest'
import { defaultCatalog, providers } from '../src/catalog'
import { createCatalog, modelRef, parseModelRef } from '../src/catalog/catalog'
import { estimateCost } from '../src/catalog/cost'

describe('catalog', () => {
  it('resolves a model ref through the provider', () => {
    const model = defaultCatalog.getModel('openai/gpt-5.2')
    expect(model?.provider).toBe('openai')
    expect(modelRef(model!)).toBe('openai/gpt-5.2')
    expect(parseModelRef('openai/gpt-5.2')).toEqual({ provider: 'openai', id: 'gpt-5.2' })
    // OpenRouter ids contain a slash themselves — only the first one is the provider
    expect(parseModelRef('openrouter/anthropic/claude-sonnet-5')).toEqual({ provider: 'openrouter', id: 'anthropic/claude-sonnet-5' })
  })

  it('is immutable: withProvider returns a new catalog', () => {
    const custom = { id: 'local', label: 'Local', byok: null, keyRequired: false, runtime: 'local' as const, models: [] }
    const next = defaultCatalog.withProvider(custom)
    expect(next.getProvider('local')).toBe(custom)
    expect(defaultCatalog.getProvider('local')).toBeUndefined()
    expect(next.withoutProvider('local').getProvider('local')).toBeUndefined()
    expect(createCatalog([custom]).models).toEqual([])
  })

  it('every provider id is a valid BYOK slug and keyRequired matches byok', () => {
    for (const p of Object.values(providers)) {
      expect(p.id).toMatch(/^[a-z][a-z0-9-]{0,63}$/)
      if (p.byok)
        expect(p.byok.id).toBe(p.id)
      for (const m of p.models)
        expect(m.provider, `${p.id}/${m.id}`).toBe(p.id)
    }
    expect(Object.keys(providers)).toHaveLength(12)
  })

  it('estimates cost in USD from per-million pricing, counting cached input separately', () => {
    const model = { id: 'm', name: 'm', provider: 'p', input: ['text' as const], reasoning: false, cost: { input: 2, output: 10, cacheRead: 0.5 } }
    const usd = estimateCost(model, { promptTokens: 1_000_000, completionTokens: 100_000, totalTokens: 1_100_000, promptTokensDetails: { cachedTokens: 500_000 } })
    // 500k fresh @2 + 500k cached @0.5 + 100k output @10
    expect(usd).toBeCloseTo(1 + 0.25 + 1, 6)
    expect(estimateCost({ ...model, cost: undefined }, { promptTokens: 1, completionTokens: 1, totalTokens: 2 })).toBeUndefined()
  })
})
