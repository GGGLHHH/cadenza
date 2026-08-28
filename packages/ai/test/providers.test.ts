// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { providers as catalog } from '../src/catalog'
import { anthropic } from '../src/providers/anthropic'
import { bedrock } from '../src/providers/bedrock'
import { byteplus } from '../src/providers/byteplus'
import { gemini } from '../src/providers/gemini'
import { grok } from '../src/providers/grok'
import { groq } from '../src/providers/groq'
import { llmgateway } from '../src/providers/llmgateway'
import { mistral } from '../src/providers/mistral'
import { ollama } from '../src/providers/ollama'
import { openai } from '../src/providers/openai'
import { openaiCompatiblePreset } from '../src/providers/openai-compatible'
import { openrouter } from '../src/providers/openrouter'
import { vercelGateway } from '../src/providers/vercel-gateway'
import { vertex } from '../src/providers/vertex'
import { geminiThinking, openaiCompatibleThinking } from '../src/server/thinking'

const KEY_BY_ID = { 'vercel-gateway': 'vercelGateway' } as const

describe('provider presets', () => {
  it.each([openai, anthropic, gemini, openrouter, grok, groq, mistral, vercelGateway, llmgateway, bedrock])('$id mirrors the catalog data and builds an adapter with a key', (p) => {
    const data = catalog[(KEY_BY_ID[p.id as keyof typeof KEY_BY_ID] ?? p.id) as keyof typeof catalog]
    expect(p.models).toBe(data.models)
    expect(p.byok?.id).toBe(data.byok?.id)
    expect(p.keyRequired).toBe(true)
    const adapter = p.create(p.models[0].id, 'sk-test')
    expect(adapter.kind).toBe('text')
    expect(adapter.model).toBe(p.models[0].id)
  })

  it('vertex reuses the gemini thinking map; a null key means project + location env (ADC)', () => {
    expect(vertex.keyRequired).toBe(false)
    expect(vertex.thinking).toBe(geminiThinking)
    expect(vertex.create(vertex.models[0].id, 'AIza-test').model).toBe(vertex.models[0].id)
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'proj')
    vi.stubEnv('GOOGLE_CLOUD_LOCATION', 'us-central1')
    expect(vertex.create(vertex.models[0].id, null).model).toBe(vertex.models[0].id)
    vi.unstubAllEnvs()
  })

  it('ollama: the "key" is a host URL, absent → default host; ids outside the catalog are allowed', () => {
    expect(ollama.keyRequired).toBe(false)
    expect(ollama.runtime).toBe('local')
    expect(ollama.create('llama3.3:latest', null).model).toBe('llama3.3:latest')
    expect(ollama.create('anything:7b', 'http://127.0.0.1:11434').model).toBe('anything:7b')
    expect(ollama.discoverModels).toBeTypeOf('function')
  })

  it('openaiCompatiblePreset: consumer data → preset with defaults', () => {
    const preset = openaiCompatiblePreset({
      id: 'deepseek',
      label: 'DeepSeek',
      baseURL: 'https://api.deepseek.com/v1',
      env: 'DEEPSEEK_API_KEY',
      models: [{ id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', input: ['text'], reasoning: true }],
    })
    expect(preset.byok).toMatchObject({ id: 'deepseek', env: ['DEEPSEEK_API_KEY'] })
    expect(preset.keyRequired).toBe(true)
    expect(preset.thinking).toBe(openaiCompatibleThinking)
    expect(preset.discoverModels).toBeTypeOf('function')
    const adapter = preset.create('deepseek-reasoner', 'sk-test')
    expect(adapter.kind).toBe('text')
    expect(adapter.model).toBe('deepseek-reasoner')
    const custom = openaiCompatiblePreset({ id: 'x', label: 'X', baseURL: 'http://x', models: [], thinking: () => ({ custom: 1 }) })
    expect(custom.thinking('high', preset.models[0])).toEqual({ custom: 1 })
    expect(() => openaiCompatiblePreset({ id: 'Bad Id', label: 'X', baseURL: 'http://x', models: [] })).toThrow()
  })

  it('byteplus is a placeholder: catalogue slug only, create() throws', () => {
    expect(byteplus.models).toEqual([])
    expect(byteplus.byok).toMatchObject({ id: 'byteplus', env: ['ARK_API_KEY', 'BYTEPLUS_API_KEY'] })
    expect(() => byteplus.create('seed-1.6', 'k')).toThrow(/ai-byteplus/)
  })
})
