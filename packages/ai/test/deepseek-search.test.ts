// @vitest-environment node
import type { StreamChunk } from '@tanstack/ai/client'
import { chat, EventType } from '@tanstack/ai'
import { ChatClient } from '@tanstack/ai-client'
import { describe, expect, it } from 'vitest'
import { deepseek } from '../src/providers/deepseek'

/**
 * One DeepSeek response with three server-side search rounds. Its built-in
 * search auto-continues inside a single response, so one HTTP reply carries
 * several `message` output items with `reasoning` and `web_search_call` items
 * between them — the shape that used to make every text block repeat the
 * earlier ones.
 */
function events(): unknown[] {
  const out: unknown[] = [{ type: 'response.created', response: { model: 'deepseek-v4-flash' } }]
  const items: unknown[] = []
  for (const [i, text] of ['A.', 'B.', 'C.'].entries()) {
    const n = i + 1
    out.push({ type: 'response.output_item.added', item: { type: 'reasoning', id: `rs_${n}` }, output_index: i * 3 })
    out.push({ type: 'response.reasoning_text.delta', delta: `think${n}`, item_id: `rs_${n}` })
    out.push({ type: 'response.output_item.done', item: { type: 'reasoning', id: `rs_${n}`, content: [{ type: 'reasoning_text', text: `think${n}` }] }, output_index: i * 3 })
    const message = { type: 'message', id: `msg_${n}`, role: 'assistant', content: [{ type: 'output_text', text, annotations: [] }] }
    out.push({ type: 'response.output_item.added', item: { type: 'message', id: `msg_${n}`, role: 'assistant', content: [] }, output_index: i * 3 + 1 })
    out.push({ type: 'response.output_text.delta', delta: text, item_id: `msg_${n}`, output_index: i * 3 + 1, content_index: 0 })
    out.push({ type: 'response.output_item.done', item: message, output_index: i * 3 + 1 })
    items.push({ type: 'reasoning', id: `rs_${n}` }, message)
    if (n < 3) {
      const search = { type: 'web_search_call', id: `ws_${n}`, action: { type: 'search', query: `q${n}` }, status: 'completed' }
      out.push({ type: 'response.output_item.added', item: search, output_index: i * 3 + 2 })
      out.push({ type: 'response.output_item.done', item: search, output_index: i * 3 + 2 })
      items.push(search)
    }
  }
  out.push({ type: 'response.completed', response: { model: 'deepseek-v4-flash', output: items, usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 } } })
  return out
}

interface Adapter { client: unknown, chatStream: (options: Record<string, unknown>) => AsyncIterable<StreamChunk> }

function searching(calls: { n: number }): Adapter {
  const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as Adapter
  adapter.client = {
    responses: {
      create: async () => {
        calls.n += 1
        return (async function* () {
          for (const event of events())
            yield event
        })()
      },
    },
  }
  return adapter
}

const logger = new Proxy({}, { get: () => (): void => {} })
const streamOptions = { model: 'deepseek-v4-flash', messages: [{ role: 'user', content: 'q' }], threadId: 't', runId: 'r', tools: [], request: {}, logger }

function settle(client: ChatClient): Promise<void> {
  return new Promise((resolve) => {
    const tick = (): void => {
      client.getIsLoading() ? setTimeout(tick, 5) : resolve()
    }
    tick()
  })
}

describe('deepseek built-in search', () => {
  it('reports each server-side search as a provider-executed tool call carrying its action', async () => {
    const chunks: StreamChunk[] = []
    for await (const chunk of searching({ n: 0 }).chatStream(streamOptions))
      chunks.push(chunk)
    const starts = chunks.filter(c => c.type === EventType.TOOL_CALL_START) as unknown as Array<{ toolName: string, metadata: { providerExecuted?: boolean } }>
    expect(starts).toHaveLength(2)
    expect(starts.every(s => s.toolName === 'web_search')).toBe(true)
    expect(starts.every(s => s.metadata.providerExecuted === true)).toBe(true)
    const ends = chunks.filter(c => c.type === EventType.TOOL_CALL_END) as unknown as Array<{ input: unknown }>
    expect(ends.map(e => e.input)).toEqual([{ type: 'search', query: 'q1' }, { type: 'search', query: 'q2' }])
  })

  it('renders one message whose text blocks do not repeat each other', async () => {
    const chunks: StreamChunk[] = []
    for await (const chunk of searching({ n: 0 }).chatStream(streamOptions))
      chunks.push(chunk)
    const client = new ChatClient({ fetcher: () => (async function* () {
      for (const chunk of chunks)
        yield chunk
    })() })
    client.attach()
    await client.sendMessage('q')
    await settle(client)
    const assistants = client.getMessages().filter(m => m.role === 'assistant')
    expect(assistants).toHaveLength(1)
    expect(assistants[0].parts.map((p) => {
      const part = p as unknown as { type: string, content?: string, state?: string }
      return part.type === 'tool-call' ? `tool-call:${part.state}` : `${part.type}:${part.content ?? ''}`
    })).toEqual([
      'thinking:think1',
      'text:A.',
      'tool-call:complete',
      'tool-result:{"type":"search","query":"q1"}',
      'thinking:think2',
      'text:B.',
      'tool-call:complete',
      'tool-result:{"type":"search","query":"q2"}',
      'thinking:think3',
      'text:C.',
    ])
    // The precondition `sourcesOf` reads: a provider-executed call whose name matches /search/i.
    const call = assistants[0].parts.find(p => p.type === 'tool-call') as unknown as { name: string, output: unknown, metadata: { providerExecuted?: boolean } }
    expect(call.name).toBe('web_search')
    expect(call.metadata.providerExecuted).toBe(true)
    expect(call.output).toEqual({ type: 'search', query: 'q1' })
  })

  it('does not send the agent loop round again looking for someone to run the search', async () => {
    const calls = { n: 0 }
    const stream = chat({ adapter: searching(calls) as never, messages: [{ role: 'user', content: 'q' }], tools: [], stream: true })
    for await (const _chunk of stream) { /* drain */ }
    expect(calls.n).toBe(1)
  })
})
