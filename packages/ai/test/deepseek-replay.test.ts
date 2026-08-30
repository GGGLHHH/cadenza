// @vitest-environment node
import { chatParamsFromRequestBody, convertMessagesToModelMessages, uiMessagesToWire } from '@tanstack/ai'
import { ChatClient } from '@tanstack/ai-client'
import { describe, expect, it } from 'vitest'
import { reasoning, scripted, text, tool } from '../src/mock'
import { deepseek } from '../src/providers/deepseek'

function settle(client: ChatClient): Promise<void> {
  return new Promise((resolve) => {
    const tick = (): void => {
      client.getIsLoading() ? setTimeout(tick, 5) : resolve()
    }
    tick()
  })
}

/** One completed turn that both called a tool and then answered, as the browser would hold it. */
async function historyAfterAToolTurn(): Promise<unknown[]> {
  const first = scripted(() => [
    reasoning('想想'),
    tool('get_time', { tz: 'Asia/Shanghai' }, { output: { iso: '1:41 PM' }, toolCallId: 'call_00_REAL' }),
    text('现在是下午 1:41（北京时间）。'),
  ], { pace: 'instant' })
  const client = new ChatClient({ fetcher: first as never })
  client.attach()
  await client.sendMessage('现在几点')
  await settle(client)
  return [...client.getMessages(), { id: 'u2', role: 'user', parts: [{ type: 'text', content: '联网搜索一下' }] }]
}

/** The production round trip: the browser's AG-UI wire body, parsed server-side, converted for the wire. */
async function replayedInput(): Promise<Array<Record<string, unknown>>> {
  const ui = await historyAfterAToolTurn()
  const body = { threadId: 't', runId: 'r', state: {}, tools: [], context: [], forwardedProps: {}, messages: uiMessagesToWire(ui as never) }
  const params = await chatParamsFromRequestBody(JSON.parse(JSON.stringify(body)) as never)
  const model = convertMessagesToModelMessages(params.messages)
  const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as { convertMessagesToInput: (m: unknown) => Array<Record<string, unknown>> }
  return adapter.convertMessagesToInput(model)
}

/** A turn where DeepSeek ran its built-in search and then answered. */
function searchTurn(): unknown[] {
  const search = { type: 'web_search_call', id: 'call_00_WS', action: { type: 'search', queries: ['shadcn select'] }, status: 'completed' }
  const message = { type: 'message', id: 'm1', role: 'assistant', content: [{ type: 'output_text', text: 'Select 是下拉选择组件。' }] }
  return [
    { type: 'response.created', response: { model: 'deepseek-v4-flash' } },
    { type: 'response.output_item.added', item: search, output_index: 0 },
    { type: 'response.output_item.done', item: search, output_index: 0 },
    { type: 'response.output_item.added', item: { type: 'message', id: 'm1', role: 'assistant', content: [] }, output_index: 1 },
    { type: 'response.output_text.delta', delta: 'Select 是下拉选择组件。', item_id: 'm1', output_index: 1 },
    { type: 'response.output_item.done', item: message, output_index: 1 },
    { type: 'response.completed', response: { model: 'deepseek-v4-flash', output: [search, message], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } } },
  ]
}

/** Drive the real adapter, fold the stream into UI messages, then replay them the production way. */
async function replayedSearchInput(): Promise<Array<Record<string, unknown>>> {
  const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as { client: unknown, chatStream: (o: Record<string, unknown>) => AsyncIterable<unknown> }
  adapter.client = { responses: { create: async () => (async function* () {
    for (const event of searchTurn())
      yield event
  })() } }
  const logger = new Proxy({}, { get: () => (): void => {} })
  const chunks: unknown[] = []
  for await (const chunk of adapter.chatStream({ model: 'deepseek-v4-flash', messages: [{ role: 'user', content: 'q' }], threadId: 't', runId: 'r', tools: [], request: {}, logger }))
    chunks.push(chunk)
  const client = new ChatClient({ fetcher: () => (async function* () {
    for (const chunk of chunks)
      yield chunk
  })() as never })
  client.attach()
  await client.sendMessage('联网搜索 shadcn select')
  await settle(client)
  const ui = [...client.getMessages(), { id: 'u2', role: 'user', parts: [{ type: 'text', content: '再补充一句' }] }]
  const body = { threadId: 't', runId: 'r2', state: {}, tools: [], context: [], forwardedProps: {}, messages: uiMessagesToWire(ui as never) }
  const params = await chatParamsFromRequestBody(JSON.parse(JSON.stringify(body)) as never)
  const model = convertMessagesToModelMessages(params.messages)
  const replay = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as { convertMessagesToInput: (m: unknown) => Array<Record<string, unknown>> }
  return replay.convertMessagesToInput(model)
}

describe('deepseek history replay', () => {
  it('keeps every function_call next to its output, with the assistant text ahead of them', async () => {
    const input = await replayedInput()
    expect(input.map(item => `${String(item.type)}${item.role === undefined ? '' : `:${String(item.role)}`}`)).toEqual([
      'message:user',
      'message:assistant',
      'function_call',
      'function_call_output',
      'message:user',
    ])
  })

  it('leaves no assistant message between a call and its output — the shape DeepSeek 400s on', async () => {
    const input = await replayedInput()
    const call = input.findIndex(item => item.type === 'function_call')
    const output = input.findIndex(item => item.type === 'function_call_output')
    expect(call).toBeGreaterThanOrEqual(0)
    expect(output).toBe(call + 1)
    expect(input[call].call_id).toBe(input[output].call_id)
  })

  it('sends a built-in search back as the web_search_call it was, not as the rewritten function call', async () => {
    const input = await replayedSearchInput()
    expect(input.map(item => String(item.type))).toEqual(['message', 'message', 'web_search_call', 'message'])
    const search = input.find(item => item.type === 'web_search_call')!
    expect(search).toMatchObject({ id: 'call_00_WS', action: { type: 'search', queries: ['shadcn select'] }, status: 'completed' })
    // The rewrite must not reach the wire in either half of the pair.
    expect(input.some(item => item.type === 'function_call' || item.type === 'function_call_output')).toBe(false)
  })
})
