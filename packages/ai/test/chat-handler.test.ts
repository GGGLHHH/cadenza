// @vitest-environment node
import type { StreamChunk } from '@tanstack/ai'
import { EventType } from '@tanstack/ai/client'
import { afterEach, describe, expect, it } from 'vitest'
import { createChatHandler } from '../src/server/chat-handler'
import { definePreset } from '../src/server/preset'

interface Seen { modelOptions?: unknown, tools?: Array<{ name: string }> }

// A fake adapter that yields one text message: enough to prove the handler wires chat() to SSE.
function fakeAdapter(seen: Seen): unknown {
  return {
    kind: 'text' as const,
    name: 'fake',
    model: 'm1',
    async* chatStream(options: { modelOptions?: unknown, threadId?: string, runId?: string, tools?: Array<{ name: string }> }): AsyncGenerator<StreamChunk> {
      seen.modelOptions = options.modelOptions
      seen.tools = options.tools
      yield { type: EventType.TEXT_MESSAGE_START, messageId: 'a1', role: 'assistant' }
      yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'a1', delta: 'hello' }
      yield { type: EventType.TEXT_MESSAGE_END, messageId: 'a1' }
      yield { type: EventType.RUN_FINISHED, threadId: options.threadId ?? 't', runId: options.runId ?? 'r', metadata: { tanstack: { finishReason: 'stop' } } }
    },
    structuredOutput: async () => {
      throw new Error('unused')
    },
  }
}

const seen: Seen = {}
const fake = definePreset({
  id: 'fake',
  label: 'Fake',
  byok: { id: 'fake', label: 'Fake', env: ['FAKE_KEY'] },
  keyRequired: true,
  runtime: 'node',
  models: [{ id: 'm1', name: 'm1', provider: 'fake', input: ['text'], reasoning: true }],
  create: () => fakeAdapter(seen) as never,
  thinking: level => ({ effort: level }),
})

function body(forwardedProps: Record<string, unknown>): string {
  return JSON.stringify({
    threadId: 't1',
    runId: 'r1',
    state: {},
    tools: [],
    context: [],
    forwardedProps,
    messages: [{ id: 'u1', role: 'user', content: 'hi' }],
  })
}

function post(handler: { POST: (r: Request) => Promise<Response> }, init: RequestInit & { headers?: Record<string, string> }): Promise<Response> {
  return handler.POST(new Request('http://x/api/ai/chat', { method: 'POST', ...init, headers: { 'content-type': 'application/json', ...init.headers } }))
}

describe('createChatHandler', () => {
  const handler = createChatHandler({ providers: [fake] })

  afterEach(() => {
    delete process.env.VERCEL
  })

  it('400 on a malformed body (thrown Response is returned, not rethrown)', async () => {
    const res = await post(handler, { body: '{not json' })
    expect(res.status).toBe(400)
  })
  it('401 byok_missing when the key is absent', async () => {
    const res = await post(handler, { body: body({ provider: 'fake', model: 'm1' }) })
    expect(res.status).toBe(401)
    const json = await res.json() as { error: { type: string } }
    expect(json.error.type).toBe('byok_missing')
  })
  it('413 when content-length exceeds maxBodyBytes', async () => {
    const small = createChatHandler({ providers: [fake], maxBodyBytes: 10 })
    const res = await post(small, { body: body({ provider: 'fake', model: 'm1' }), headers: { 'x-byok-fake': 'k', 'content-length': '999' } })
    expect(res.status).toBe(413)
  })
  it('streams SSE and passes only the thinking-derived modelOptions', async () => {
    const res = await post(handler, { body: body({ provider: 'fake', model: 'm1', thinking: 'high', modelOptions: { tools: ['evil'] } }), headers: { 'x-byok-fake': 'k' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const sse = await res.text()
    expect(sse).toContain('TEXT_MESSAGE_CONTENT')
    expect(sse).toContain('hello')
    expect(seen.modelOptions).toEqual({ effort: 'high' })
  })
  it('resolves the function form of tools against the selection', async () => {
    const perProvider = createChatHandler({
      providers: [fake],
      tools: sel => sel.preset.id === 'fake' ? [{ name: 'only_for_fake', description: 'x' } as never] : [],
    })
    const res = await post(perProvider, { body: body({ provider: 'fake', model: 'm1' }), headers: { 'x-byok-fake': 'k' } })
    expect(res.status).toBe(200)
    await res.text()
    expect(seen.tools?.map(t => t.name)).toEqual(['only_for_fake'])
  })
  it('onSelect can short-circuit with a Response', async () => {
    const gated = createChatHandler({ providers: [fake], onSelect: () => new Response('nope', { status: 403 }) })
    const res = await post(gated, { body: body({ provider: 'fake', model: 'm1' }), headers: { 'x-byok-fake': 'k' } })
    expect(res.status).toBe(403)
  })
  it('drops local presets on Vercel', async () => {
    process.env.VERCEL = '1'
    const local = definePreset({ ...fake, id: 'ollama', byok: null, keyRequired: false, runtime: 'local' })
    const h = createChatHandler({ providers: [local] })
    const res = await post(h, { body: body({ provider: 'ollama', model: 'm1' }) })
    expect(res.status).toBe(400)
  })
  it('rejects an ollama host outside the private ranges', async () => {
    const ollama = definePreset({ ...fake, id: 'ollama', byok: { id: 'ollama', label: 'Ollama', env: [] }, keyRequired: false, runtime: 'local' })
    const h = createChatHandler({ providers: [ollama] })
    const res = await post(h, { body: body({ provider: 'ollama', model: 'm1' }), headers: { 'x-byok-ollama': 'http://evil.example.com' } })
    expect(res.status).toBe(400)
  })
  it('answers 404 to GET without persistence or durability', async () => {
    const res = await handler.GET(new Request('http://x/api/ai/chat?threadId=t1'))
    expect(res.status).toBe(404)
  })
})
