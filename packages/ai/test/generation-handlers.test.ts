// @vitest-environment node
import type { AnySummarizeAdapter, AnyTranscriptionAdapter } from '@tanstack/ai'
import { defineByokProvider } from '@tanstack/ai/byok'
import { describe, expect, it } from 'vitest'
import { createSummarizeHandler, createTranscriptionHandler } from '../src/server/generation-handlers'

const byok = defineByokProvider({ id: 'fake', label: 'Fake', env: [] })

interface Seen { model?: string, key?: string | null }

function transcriptionAdapter(seen: Seen): (model: string, key: string | null) => AnyTranscriptionAdapter {
  return (model, key) => {
    seen.model = model
    seen.key = key
    return { kind: 'transcription', name: 'fake', model, transcribe: async () => ({ id: 't1', model, text: 'hello' }) } as unknown as AnyTranscriptionAdapter
  }
}

function summarizeAdapter(seen: Seen): (model: string, key: string | null) => AnySummarizeAdapter {
  return (model, key) => {
    seen.model = model
    seen.key = key
    return { kind: 'summarize', name: 'fake', model, summarize: async () => ({ id: 's1', model, summary: 'hello', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } }) } as unknown as AnySummarizeAdapter
  }
}

function post(handler: { POST: (r: Request) => Promise<Response> }, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return handler.POST(new Request('http://x/api/ai/x', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } }))
}

// Mirrors what `GenerationClient` posts through `fetchServerSentEvents`.
function envelope(data: Record<string, unknown>, forwardedProps: Record<string, unknown> = {}): Record<string, unknown> {
  return { threadId: 't1', runId: 'r1', state: {}, messages: [], tools: [], context: [], forwardedProps: { ...forwardedProps, ...data }, data: { ...forwardedProps, ...data } }
}

describe.each([
  ['createTranscriptionHandler', (seen: Seen, maxBodyBytes?: number) => createTranscriptionHandler({ adapter: transcriptionAdapter(seen), byok, defaultModel: 'whisper-1', maxBodyBytes }), { audio: 'AAAA' }],
  ['createSummarizeHandler', (seen: Seen, maxBodyBytes?: number) => createSummarizeHandler({ adapter: summarizeAdapter(seen), byok, defaultModel: 'gpt-mini', maxBodyBytes }), { text: 'long text' }],
] as const)('%s', (_name, make, input) => {
  it('413 when content-length exceeds maxBodyBytes', async () => {
    const res = await post(make({}, 10), envelope(input), { 'x-byok-fake': 'k', 'content-length': '999' })
    expect(res.status).toBe(413)
  })
  it('400 on a malformed body', async () => {
    const res = await make({}).POST(new Request('http://x/api/ai/x', { method: 'POST', body: '{not json', headers: { 'content-type': 'application/json' } }))
    expect(res.status).toBe(400)
  })
  it('400 when the required input field is missing', async () => {
    const res = await post(make({}), envelope({}), { 'x-byok-fake': 'k' })
    expect(res.status).toBe(400)
  })
  it('401 byok_missing when the key is absent', async () => {
    const res = await post(make({}), envelope(input))
    expect(res.status).toBe(401)
    const json = await res.json() as { error: { type: string } }
    expect(json.error.type).toBe('byok_missing')
  })
  it('400 unknown_model on a malformed forwardedProps.model', async () => {
    const res = await post(make({}), envelope(input, { model: 'bad model!' }), { 'x-byok-fake': 'k' })
    expect(res.status).toBe(400)
  })
  it('streams SSE with the result; model from forwardedProps, key from the header', async () => {
    const seen: Seen = {}
    const res = await post(make(seen), envelope(input, { model: 'm2' }), { 'x-byok-fake': 'k' })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const sse = await res.text()
    expect(sse).toContain('generation:result')
    expect(sse).toContain('hello')
    expect(sse).toContain('RUN_FINISHED')
    expect(seen).toEqual({ model: 'm2', key: 'k' })
  })
  it('falls back to defaultModel and accepts the bare input shape', async () => {
    const seen: Seen = {}
    const res = await post(make(seen), input, { 'x-byok-fake': 'k' })
    expect(res.status).toBe(200)
    expect(seen.model).toBe(_name === 'createTranscriptionHandler' ? 'whisper-1' : 'gpt-mini')
  })
})

it('keyless handlers pass null to the adapter', async () => {
  const seen: Seen = {}
  const handler = createSummarizeHandler({ adapter: summarizeAdapter(seen), defaultModel: 'local' })
  const res = await post(handler, { text: 'x' })
  expect(res.status).toBe(200)
  expect(seen).toEqual({ model: 'local', key: null })
})
