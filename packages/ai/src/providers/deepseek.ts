import type { ModelMessage } from '@tanstack/ai'
import { OpenAICompatibleChatAdapter, openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { deepseek as data } from '../catalog/providers/deepseek'
import { definePreset } from '../server/preset'
import { deepseekThinking } from '../server/thinking'
import { openaiCompatiblePreset } from './openai-compatible'

const BASE_URL = 'https://api.deepseek.com'

type Client = ConstructorParameters<typeof OpenAICompatibleChatAdapter>[0]

/**
 * The compatible adapter with DeepSeek's two dialect differences: thinking
 * streams as `delta.reasoning_content` (the base ignores it), and with
 * thinking on, a tool-call round 400s unless every assistant turn carries
 * `reasoning_content` back — DeepSeek accepts an empty string there.
 * Module-private: its declaration would need the openai SDK's types, which this
 * package cannot name; `deepseek.create()` is the way to one.
 */
class DeepSeekChatAdapter extends OpenAICompatibleChatAdapter<string> {
  constructor(client: Client, model: string) {
    super(client, model, 'deepseek')
  }

  protected override extractReasoning(chunk: unknown): { text: string } | undefined {
    const delta = (chunk as { choices?: Array<{ delta?: { reasoning_content?: unknown } }> }).choices?.[0]?.delta
    const raw = delta?.reasoning_content
    return typeof raw === 'string' && raw.length > 0 ? { text: raw } : undefined
  }

  // eslint-disable-next-line ts/explicit-function-return-type -- the wire type is the openai SDK's `ChatCompletionMessageParam`, which this package cannot name; the base's signature is the contract.
  protected override convertMessage(message: ModelMessage) {
    const converted = super.convertMessage(message)
    if (message.role !== 'assistant' || converted.role !== 'assistant')
      return converted
    const reasoning = (message.thinking ?? []).map(t => t.content).join('\n')
    return { ...converted, reasoning_content: reasoning }
  }
}

const compatible = openaiCompatiblePreset({
  id: data.id,
  label: data.label,
  baseURL: BASE_URL,
  env: 'DEEPSEEK_API_KEY',
  models: data.models,
  thinking: deepseekThinking,
})

/**
 * DeepSeek speaks the OpenAI Chat Completions protocol, so the preset is the
 * compatible one (`discoverModels` = `GET /models` included) with the adapter
 * swapped for `DeepSeekChatAdapter`. The `openai` client is borrowed from the
 * compatible factory: this package cannot resolve the SDK itself.
 */
export const deepseek = definePreset({
  ...compatible,
  create: (model, key) => {
    const base = openaiCompatibleText(model, { baseURL: BASE_URL, apiKey: key ?? '', name: 'deepseek' })
    return new DeepSeekChatAdapter((base as unknown as { client: Client }).client, model)
  },
})
