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
