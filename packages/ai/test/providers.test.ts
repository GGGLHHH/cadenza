// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { providers as catalog } from '../src/catalog'
import { anthropic } from '../src/providers/anthropic'
import { gemini } from '../src/providers/gemini'
import { openai } from '../src/providers/openai'
import { openrouter } from '../src/providers/openrouter'

describe('provider presets', () => {
  it.each([openai, anthropic, gemini, openrouter])('$id mirrors the catalog data and builds an adapter with a key', (p) => {
    const data = catalog[p.id as keyof typeof catalog]
    expect(p.models).toBe(data.models)
    expect(p.byok?.id).toBe(data.byok?.id)
    const adapter = p.create(p.models[0].id, 'sk-test')
    expect(adapter.kind).toBe('text')
    expect(adapter.model).toBe(p.models[0].id)
  })
})
