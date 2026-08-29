// @vitest-environment node
import { EventType } from '@tanstack/ai'
import { describe, expect, it } from 'vitest'
import { deepseek as data } from '../src/catalog/providers/deepseek'
import { deepseek } from '../src/providers/deepseek'
import { deepseekThinking } from '../src/server/thinking'

// A fake OpenAI SDK client: records the request, streams DeepSeek-shaped chunks
// (reasoning_content deltas first, then content), so the whole base-class
// pipeline runs — request mapping, extractReasoning, AG-UI events.
function fakeClient(seen: { params?: Record<string, unknown> }): unknown {
  const chunks = [
    { id: 'c', choices: [{ index: 0, delta: { role: 'assistant', reasoning_content: 'Let me ' }, finish_reason: null }] },
    { id: 'c', choices: [{ index: 0, delta: { reasoning_content: 'think.' }, finish_reason: null }] },
    { id: 'c', choices: [{ index: 0, delta: { content: 'Paris.' }, finish_reason: null }] },
    { id: 'c', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } },
  ]
  return {
    chat: {
      completions: {
        create: async (params: Record<string, unknown>) => {
          seen.params = params
          return (async function* () {
            for (const c of chunks)
              yield c
          })()
        },
      },
    },
  }
}

describe('deepseek pipeline', () => {
  it('sends the thinking switch and turns reasoning_content into REASONING events before the text', async () => {
    const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as { client: unknown, chatStream: (o: Record<string, unknown>) => AsyncIterable<{ type: string, delta?: string }> }
    const seen: { params?: Record<string, unknown> } = {}
    adapter.client = fakeClient(seen)
    const model = data.models[0]
    const types: string[] = []
    let reasoning = ''
    let text = ''
    // What chat() hands an adapter besides the messages: the model name, a logger, request options.
    const logger = new Proxy({}, { get: () => (): void => {} })
    const options = { model: 'deepseek-v4-flash', messages: [{ role: 'user', content: 'capital of France?' }], modelOptions: deepseekThinking('high', model), threadId: 't', runId: 'r', tools: [], request: {}, logger }
    for await (const chunk of adapter.chatStream(options)) {
      types.push(chunk.type)
      if (chunk.type === EventType.REASONING_MESSAGE_CONTENT)
        reasoning += chunk.delta ?? ''
      if (chunk.type === EventType.TEXT_MESSAGE_CONTENT)
        text += chunk.delta ?? ''
    }
    expect(seen.params).toMatchObject({ model: 'deepseek-v4-flash', thinking: { type: 'enabled' }, reasoning_effort: 'high', stream: true })
    expect(reasoning).toBe('Let me think.')
    expect(text).toBe('Paris.')
    expect(types.indexOf(EventType.REASONING_MESSAGE_CONTENT)).toBeLessThan(types.indexOf(EventType.TEXT_MESSAGE_CONTENT))
    expect(types).toContain(EventType.REASONING_END)
  })

  it('off sends thinking disabled', () => {
    expect(deepseekThinking('off', data.models[0])).toEqual({ thinking: { type: 'disabled' } })
  })
})
