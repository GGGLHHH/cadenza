import type { StreamChunk } from '@tanstack/ai/client'
import { ChatClient } from '@tanstack/ai-client'
import { toolDefinition } from '@tanstack/ai/client'
import { describe, expect, it } from 'vitest'
import { approvalOf, byokMissing, reasoning, scripted, sequence, text, tool, usage } from '../src/mock'

function settle(client: ChatClient): Promise<void> {
  return new Promise((resolve) => {
    const tick = (): void => {
      if (client.getIsLoading())
        setTimeout(tick, 5)
      else
        resolve()
    }
    tick()
  })
}

describe('scripted transport', () => {
  it('streams text, reasoning and a tool call into parts, then finishes with usage', async () => {
    const fetcher = scripted(() => [reasoning('Think.'), tool('get_time', { tz: 'UTC' }, { output: { iso: '2026-08-28' } }), text('Done.'), usage({ inputTokens: 12, outputTokens: 3 })], { pace: 'instant' })
    const chunks: StreamChunk[] = []
    const client = new ChatClient({ fetcher, onChunk: c => chunks.push(c) })
    client.attach()
    await client.sendMessage('hi')
    await settle(client)
    const last = client.getMessages().at(-1)!
    expect(last.role).toBe('assistant')
    const types = last.parts.map(p => p.type)
    expect(types).toContain('thinking')
    expect(types).toContain('tool-call')
    expect(types).toContain('text')
    const call = last.parts.find(p => p.type === 'tool-call')!
    expect(call.state).toBe('complete')
    expect(client.getStatus()).toBe('ready')
    expect(chunks.filter(c => c.type === 'TEXT_MESSAGE_START')).toHaveLength(1)
    expect(chunks.some(c => c.type === 'MESSAGES_SNAPSHOT')).toBe(false)
    const finished = chunks.find(c => c.type === 'RUN_FINISHED')!
    // ChatClient rebuilds the AG-UI `usage[]` into TokenUsage before `onChunk`
    expect(finished.usage).toEqual({ promptTokens: 12, completionTokens: 3, totalTokens: 15 })
  })

  it('carries the usage fields with no spec slot through the leftover channel', async () => {
    // `cachedInputTokens` / `reasoningTokens` are AG-UI spec fields; cache
    // writes and the modality breakdown are not, so they ride
    // `metadata.tanstack.usage` — the same road the real transport uses. A
    // script that could not send them would leave those metrics untestable.
    const fetcher = scripted(() => [
      text('Done.'),
      usage(
        { inputTokens: 100, outputTokens: 20, cachedInputTokens: 60, reasoningTokens: 8 },
        { promptTokensDetails: { cacheWriteTokens: 15, imageTokens: 40 }, cost: 0.25 },
      ),
    ], { pace: 'instant' })
    const chunks: StreamChunk[] = []
    const client = new ChatClient({ fetcher, onChunk: c => chunks.push(c) })
    client.attach()
    await client.sendMessage('hi')
    await settle(client)
    const finished = chunks.find(c => c.type === 'RUN_FINISHED')!
    expect(finished.usage).toEqual({
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      cost: 0.25,
      promptTokensDetails: { cachedTokens: 60, cacheWriteTokens: 15, imageTokens: 40 },
      completionTokensDetails: { reasoningTokens: 8 },
    })
  })

  it('answers as a text/event-stream Response when sse is on, and the client parses it the same way', async () => {
    const fetcher = scripted(() => [reasoning('Think.'), tool('get_time', { tz: 'UTC' }, { output: { iso: '2026-08-28' } }), text('Done.')], { pace: 'instant', sse: true, argsChunk: 3 })
    const raw = await fetcher({ messages: [], data: {}, threadId: 't', runId: 'r' }, { signal: new AbortController().signal })
    expect(raw).toBeInstanceOf(Response)
    expect((raw as Response).headers.get('content-type')).toBe('text/event-stream')
    const body = await (raw as Response).text()
    expect(body.startsWith('data: {')).toBe(true)
    expect((body.match(/"type":"TOOL_CALL_ARGS"/g) ?? []).length).toBeGreaterThan(1)
    const client = new ChatClient({ fetcher: scripted(() => [reasoning('Think.'), tool('get_time', { tz: 'UTC' }, { output: { iso: '2026-08-28' } }), text('Done.')], { pace: 'instant', sse: true }) })
    client.attach()
    await client.sendMessage('hi')
    await settle(client)
    const last = client.getMessages().at(-1)!
    const types = last.parts.map(p => p.type)
    // The SSE path keeps the `tool-result` part the iterable path folds away; order is what matters.
    expect(types).toEqual(expect.arrayContaining(['thinking', 'tool-call', 'text']))
    expect(types.indexOf('thinking')).toBeLessThan(types.indexOf('tool-call'))
    expect(types.indexOf('tool-call')).toBeLessThan(types.indexOf('text'))
    expect(last.parts.find(p => p.type === 'tool-call')?.state).toBe('complete')
    expect(client.getStatus()).toBe('ready')
  })

  it('keeps consecutive reasoning blocks in separate thinking parts', async () => {
    const fetcher = scripted(() => [reasoning('One.', { signature: 'sig-1' }), reasoning('Two.')], { pace: 'instant' })
    const client = new ChatClient({ fetcher })
    client.attach()
    await client.sendMessage('hi')
    await settle(client)
    const thinking = client.getMessages().at(-1)!.parts.filter(p => p.type === 'thinking')
    expect(thinking.map(p => p.content)).toEqual(['One.', 'Two.'])
    // ai-client's ThinkingPart type omits `signature`; the engine still forwards it
    expect((thinking[0] as { signature?: string }).signature).toBe('sig-1')
  })

  it('pauses on an approval interrupt and resumes with the decision on the next turn', async () => {
    const fetcher = scripted(sequence([
      [tool('move', { day: 'Fri' }, { approval: true })],
      ctx => (approvalOf(ctx, 'call-1')?.approved ? [tool.result('call-1', { moved: true }), text('Moved.')] : [text('Left alone.')]),
    ]), { pace: 'instant', toolCallId: () => 'call-1' })
    // Binding to a typed `tool-approval` interrupt needs the same tool registered
    // client-side with the scripted transport's permissive input schema.
    const move = toolDefinition({ name: 'move', description: 'Move the meeting', inputSchema: { type: 'object', additionalProperties: true }, needsApproval: true })
    const client = new ChatClient({ fetcher, tools: [move] })
    client.attach()
    await client.sendMessage('move it')
    await settle(client)
    const interrupts = client.getInterruptState().interrupts
    expect(interrupts).toHaveLength(1)
    expect(interrupts[0].kind).toBe('tool-approval')
    expect(interrupts[0].metadata?.kind).toBe('approval')
    const approval = interrupts[0] as Extract<(typeof interrupts)[number], { kind: 'tool-approval' }>
    approval.resolveInterrupt(true)
    await settle(client)
    const last = client.getMessages().at(-1)!
    expect(last.parts.some(p => p.type === 'text' && p.content === 'Moved.')).toBe(true)
    expect(client.getInterruptState().interrupts).toHaveLength(0)
  })

  it('stops yielding once the signal aborts', async () => {
    const fetcher = scripted(() => [text('a '.repeat(500), { chunk: 'word' })], { pace: 5 })
    const client = new ChatClient({ fetcher })
    client.attach()
    const send = client.sendMessage('go')
    await new Promise(r => setTimeout(r, 30))
    client.stop()
    await send
    expect(client.getStatus()).toBe('ready')
  })

  it('byokMissing returns a 401 the client turns into a key request', async () => {
    const requests: string[] = []
    const { defineByok, memoryStorage } = await import('@tanstack/ai-client/byok')
    const byok = defineByok({ storage: memoryStorage() })
    byok.setServerCoverage({ openai: true })
    byok.subscribe(() => {
      const p = byok.getSnapshot().prompt
      if (p)
        requests.push(p.provider)
    })
    const client = new ChatClient({ fetcher: scripted(() => byokMissing('openai')), byok, byokProvider: () => 'openai' })
    client.attach()
    await client.sendMessage('hi').catch(() => {})
    await settle(client)
    expect(requests).toContain('openai')
  })
})
