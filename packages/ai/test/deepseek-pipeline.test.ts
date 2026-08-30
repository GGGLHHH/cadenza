// @vitest-environment node
import { EventType } from '@tanstack/ai'
import { describe, expect, it } from 'vitest'
import { deepseek as data } from '../src/catalog/providers/deepseek'
import { deepseek, deepseekWebSearch } from '../src/providers/deepseek'
import { deepseekResponsesThinking } from '../src/server/thinking'

// A fake OpenAI SDK client on the Responses surface: records the request, then
// streams the events DeepSeek documents for `/responses` (reasoning text first,
// then output text) so the whole base-class pipeline runs — request mapping,
// reasoning accumulation, AG-UI events.
function fakeClient(seen: { params?: Record<string, unknown> }): unknown {
  const events = [
    { type: 'response.created', response: { model: 'deepseek-v4-flash' } },
    { type: 'response.reasoning_text.delta', delta: 'Let me ' },
    { type: 'response.reasoning_text.delta', delta: 'think.' },
    { type: 'response.output_text.delta', delta: 'Paris.' },
    {
      type: 'response.completed',
      response: {
        model: 'deepseek-v4-flash',
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'Paris.' }] }],
        usage: { input_tokens: 3, output_tokens: 4, total_tokens: 7 },
      },
    },
  ]
  return {
    responses: {
      create: async (params: Record<string, unknown>) => {
        seen.params = params
        return (async function* () {
          for (const e of events)
            yield e
        })()
      },
    },
  }
}

describe('deepseek pipeline', () => {
  it('sends reasoning.effort plus the built-in search, and turns reasoning_text into REASONING events before the text', async () => {
    const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as { client: unknown, chatStream: (o: Record<string, unknown>) => AsyncIterable<{ type: string, delta?: string }> }
    const seen: { params?: Record<string, unknown> } = {}
    adapter.client = fakeClient(seen)
    const model = data.models[0]
    const types: string[] = []
    let reasoning = ''
    let text = ''
    // What chat() hands an adapter besides the messages: the model name, a logger, request options.
    const logger = new Proxy({}, { get: () => (): void => {} })
    const options = {
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: 'capital of France?' }],
      modelOptions: deepseekResponsesThinking('high', model),
      threadId: 't',
      runId: 'r',
      tools: [deepseekWebSearch()],
      request: {},
      logger,
    }
    for await (const chunk of adapter.chatStream(options)) {
      types.push(chunk.type)
      if (chunk.type === EventType.REASONING_MESSAGE_CONTENT)
        reasoning += chunk.delta ?? ''
      if (chunk.type === EventType.TEXT_MESSAGE_CONTENT)
        text += chunk.delta ?? ''
    }
    expect(seen.params).toMatchObject({ model: 'deepseek-v4-flash', reasoning: { effort: 'high' }, tools: [{ type: 'web_search' }], stream: true })
    expect(reasoning).toBe('Let me think.')
    expect(text).toBe('Paris.')
    expect(types.indexOf(EventType.REASONING_MESSAGE_CONTENT)).toBeLessThan(types.indexOf(EventType.TEXT_MESSAGE_CONTENT))
    expect(types).toContain(EventType.REASONING_END)
  })

  it('off asks for effort none rather than dropping the key', () => {
    expect(deepseekResponsesThinking('off', data.models[0])).toEqual({ reasoning: { effort: 'none' } })
  })
})
