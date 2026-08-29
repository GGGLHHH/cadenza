// @vitest-environment node
import type { StreamChunk } from '@tanstack/ai'
import type { ProviderPreset } from '../src/server/preset'
import { EventType } from '@tanstack/ai'
import { describe, expect, it } from 'vitest'
import { definePreset } from '../src/server/preset'
import { cleanTitle, createTitleHandler } from '../src/server/title-handler'

interface Seen { modelOptions?: unknown, system?: unknown, user?: unknown }

function fakeAdapter(reply: string, seen: Seen): unknown {
  return {
    kind: 'text' as const,
    name: 'fake',
    model: 'm1',
    async* chatStream(options: { modelOptions?: unknown, systemPrompts?: unknown, messages: Array<{ role: string, content: unknown }>, threadId?: string, runId?: string }): AsyncGenerator<StreamChunk> {
      seen.modelOptions = options.modelOptions
      seen.system = options.systemPrompts
      seen.user = options.messages.find(m => m.role === 'user')?.content
      yield { type: EventType.TEXT_MESSAGE_START, messageId: 'a1', role: 'assistant' }
      yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'a1', delta: reply }
      yield { type: EventType.TEXT_MESSAGE_END, messageId: 'a1' }
      yield { type: EventType.RUN_FINISHED, threadId: options.threadId ?? 't', runId: options.runId ?? 'r', metadata: { tanstack: { finishReason: 'stop' } } }
    },
    structuredOutput: async () => {
      throw new Error('unused')
    },
  }
}

function preset(reply: string, seen: Seen): ProviderPreset {
  return definePreset({
    id: 'fake',
    label: 'Fake',
    byok: { id: 'fake', label: 'Fake', env: ['FAKE_KEY'] },
    keyRequired: true,
    runtime: 'node',
    models: [{ id: 'm1', name: 'M1', provider: 'fake', input: ['text'], reasoning: true }],
    create: () => fakeAdapter(reply, seen) as never,
    thinking: level => ({ effort: level }),
  })
}

function post(h: { POST: (r: Request) => Promise<Response> }, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return h.POST(new Request('http://x/api/ai/title', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }))
}

describe('cleanTitle', () => {
  it('drops quotes, labels, fences and trailing punctuation, keeps one line', () => {
    expect(cleanTitle('"Rehearsal plan."')).toBe('Rehearsal plan')
    expect(cleanTitle('Title: 排练计划。\n\n(extra)')).toBe('排练计划')
    expect(cleanTitle('```\nTitle here\n```')).toBe('Title here')
    expect(cleanTitle('  **Bold  title**  ')).toBe('Bold title')
    expect(cleanTitle('x'.repeat(100), 10)).toBe(`${'x'.repeat(10)}…`)
  })
})

describe('createTitleHandler', () => {
  it('names the thread with the conversation\'s own model, thinking off, and the title prompt', async () => {
    const seen: Seen = {}
    const h = createTitleHandler({ providers: [preset('"Rehearsal plan."', seen)] })
    const res = await post(h, { data: { text: 'user: hi\nassistant: hello' }, forwardedProps: { provider: 'fake', model: 'm1', thinking: 'high' } }, { 'x-byok-fake': 'sk' })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const sse = await res.text()
    expect(sse).toContain('Rehearsal plan')
    expect(sse).not.toContain('Rehearsal plan.')
    expect(seen.modelOptions).toEqual({ effort: 'off' })
    expect(JSON.stringify(seen.system)).toContain('at most 6 words')
    expect(seen.user).toBe('user: hi\nassistant: hello')
  })

  it('401 byok_missing without a key, 400 without text, 400 on an unknown provider', async () => {
    const h = createTitleHandler({ providers: [preset('t', {})] })
    expect((await post(h, { data: { text: 'x' }, forwardedProps: { provider: 'fake', model: 'm1' } })).status).toBe(401)
    expect((await post(h, { data: {}, forwardedProps: { provider: 'fake', model: 'm1' } }, { 'x-byok-fake': 'sk' })).status).toBe(400)
    expect((await post(h, { data: { text: 'x' }, forwardedProps: { provider: 'nope', model: 'm1' } }, { 'x-byok-fake': 'sk' })).status).toBe(400)
  })

  it('honours maxWords and a custom prompt', async () => {
    const seen: Seen = {}
    const h = createTitleHandler({ providers: [preset('t', seen)], maxWords: 3, prompt: n => `name it in ${n} words` })
    // The activity starts when the SSE body is read, not when the Response is returned.
    await (await post(h, { data: { text: 'x' }, forwardedProps: { provider: 'fake', model: 'm1' } }, { 'x-byok-fake': 'sk' })).text()
    expect(JSON.stringify(seen.system)).toContain('name it in 3 words')
  })
})
