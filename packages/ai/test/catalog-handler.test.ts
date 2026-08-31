// @vitest-environment node
import type { ProviderPreset } from '../src/server/preset'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ollama } from '../src/providers/ollama'
import { openaiCompatiblePreset } from '../src/providers/openai-compatible'
import { createCatalogHandler } from '../src/server/catalog-handler'
import { definePreset } from '../src/server/preset'

function p(id: string, extra: Partial<ProviderPreset>): ProviderPreset {
  return definePreset({
    id,
    label: id,
    byok: { id, label: id, env: [`${id.toUpperCase()}_KEY`] },
    keyRequired: true,
    runtime: 'node',
    models: [],
    create: () => ({}) as never,
    thinking: () => ({}),
    ...extra,
  })
}

const get = (h: { GET: (r: Request) => Promise<Response> }, qs = '', headers: Record<string, string> = {}): Promise<Response> => h.GET(new Request(`http://x/api/ai/catalog${qs}`, { headers }))

describe('createCatalogHandler', () => {
  afterEach(() => {
    delete process.env.A_KEY
    delete process.env.GOOGLE_CLOUD_PROJECT
    vi.unstubAllGlobals()
  })

  it('reports coverage from env, keyless providers always covered, vertex needs key or project+location', async () => {
    process.env.A_KEY = 'x'
    delete process.env.B_KEY
    delete process.env.GOOGLE_VERTEX_API_KEY
    process.env.GOOGLE_CLOUD_PROJECT = 'proj'
    delete process.env.GOOGLE_CLOUD_LOCATION
    const h = createCatalogHandler([p('a', {}), p('b', {}), p('c', { keyRequired: false }), p('vertex', { keyRequired: false })])
    const json = await (await get(h)).json() as { coverage: Record<string, boolean>, providers: Array<Record<string, unknown>> }
    expect(json.coverage).toEqual({ a: true, b: false, c: true, vertex: false })
    expect(json.providers[0]).not.toHaveProperty('create')
    expect(json.providers[0]).not.toHaveProperty('thinking')
    expect(json.providers[0]).not.toHaveProperty('discoverModels')
  })

  it('refresh: unknown provider → 400, no discoverModels → 400, otherwise { provider, models } with the BYOK key', async () => {
    const discoverModels = vi.fn(async (key: string | null) => [{ id: `m-${key}`, name: 'm', provider: 'd', input: ['text' as const], reasoning: false }])
    const h = createCatalogHandler([p('a', {}), p('d', { discoverModels })])
    expect((await get(h, '?refresh=1&provider=zzz')).status).toBe(400)
    const noDiscover = await get(h, '?refresh=1&provider=a')
    expect(noDiscover.status).toBe(400)
    expect(await noDiscover.json()).toEqual({ error: { type: 'discover_unsupported', provider: 'a' } })
    const ok = await get(h, '?refresh=1&provider=d', { 'x-byok-d': 'sk-1' })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ provider: 'd', models: [{ id: 'm-sk-1', name: 'm', provider: 'd', input: ['text'], reasoning: false }] })
    expect(discoverModels).toHaveBeenCalledWith('sk-1')
  })

  it('refresh: a throwing discoverModels → 502 discover_failed', async () => {
    const h = createCatalogHandler([p('d', { discoverModels: () => Promise.reject(new Error('boom http://secret-host')) })])
    const res = await get(h, '?refresh=1&provider=d')
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: { type: 'discover_failed', provider: 'd' } })
  })

  it('ollama discovers via GET {host}/api/tags and merges catalog metadata', async () => {
    const fetchMock = vi.fn(async () => Response.json({ models: [{ name: 'qwen3:latest' }, { name: 'custom:7b' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const h = createCatalogHandler([ollama])
    const json = await (await get(h, '?refresh=1&provider=ollama', { 'x-byok-ollama': 'http://127.0.0.1:11434/' })).json() as { models: Array<{ id: string, reasoning: boolean }> }
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:11434/api/tags')
    expect(json.models.map(m => [m.id, m.reasoning])).toEqual([['qwen3:latest', true], ['custom:7b', false]])
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    expect((await get(h, '?refresh=1&provider=ollama')).status).toBe(502)
  })

  it('refuses to discover against a host outside the allowlist, and never fetches it', async () => {
    // `x-byok-ollama` is a host this request would fetch, not a key. Unguarded
    // it is a server-side request forgery — the chat handler checks the same
    // header, and this path used to hand it straight to `discoverModels`.
    const fetchMock = vi.fn(async () => Response.json({ models: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const h = createCatalogHandler([ollama])
    const res = await get(h, '?refresh=1&provider=ollama', { 'x-byok-ollama': 'http://169.254.169.254/latest/meta-data' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: { type: 'host_not_allowed', provider: 'ollama' } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('honours its own ollamaHosts option', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ models: [] })))
    const h = createCatalogHandler([ollama], { ollamaHosts: ['ollama.internal:11434'] })
    expect((await get(h, '?refresh=1&provider=ollama', { 'x-byok-ollama': 'http://ollama.internal:11434' })).status).toBe(200)
    expect((await get(h, '?refresh=1&provider=ollama', { 'x-byok-ollama': 'http://127.0.0.1:11434' })).status).toBe(400)
  })

  it('openai-compatible discovers via GET {baseURL}/models with a Bearer key', async () => {
    const fetchMock = vi.fn(async () => Response.json({ data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const preset = openaiCompatiblePreset({ id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', models: [{ id: 'deepseek-reasoner', name: 'R', provider: 'deepseek', input: ['text'], reasoning: true }] })
    const h = createCatalogHandler([preset])
    const json = await (await get(h, '?refresh=1&provider=deepseek', { 'x-byok-deepseek': 'sk-2' })).json() as { models: Array<{ id: string, name: string, reasoning: boolean }> }
    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/v1/models', { headers: { authorization: 'Bearer sk-2' } })
    expect(json.models).toEqual([
      { id: 'deepseek-chat', name: 'deepseek-chat', provider: 'deepseek', input: ['text'], reasoning: false },
      { id: 'deepseek-reasoner', name: 'R', provider: 'deepseek', input: ['text'], reasoning: true },
    ])
  })
})
