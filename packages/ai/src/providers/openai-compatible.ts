import type { CompatibleApi } from '@tanstack/ai-openai/compatible'
import type { Model } from '../catalog/types'
import type { ProviderPreset } from '../server/preset'
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { defineByokProvider } from '@tanstack/ai/byok'
import { definePreset } from '../server/preset'
import { openaiCompatibleThinking } from '../server/thinking'

export interface OpenAICompatibleConfig {
  /** BYOK slug (`x-byok-<id>`), `/^[a-z][a-z0-9-]{0,63}$/`. */
  id: string
  label: string
  baseURL: string
  /** Env names `getByokKey` may fall back to, in order. */
  env?: string | readonly string[]
  models: readonly Model[]
  /**
   * Which OpenAI protocol the endpoint speaks. Default `'chat-completions'`
   * (`{baseURL}/chat/completions`); `'responses'` targets `{baseURL}/responses`,
   * which a few compatible vendors implement — and where their built-in tools
   * (DeepSeek's `web_search`) and native reasoning events live.
   */
  api?: CompatibleApi
  /** Defaults to `openaiCompatibleThinking` (`reasoning_effort` for reasoning models). */
  thinking?: ProviderPreset['thinking']
  /** Adapter name shown in TanStack AI's events / debug output; defaults to `id`. */
  name?: string
}

/** `GET {baseURL}/models` (Bearer key) → `data[].id`; catalog metadata wins when the id is known. */
async function discoverCompatibleModels(config: OpenAICompatibleConfig, key: string | null): Promise<Model[]> {
  const res = await fetch(`${config.baseURL.replace(/\/$/, '')}/models`, { headers: key !== null ? { authorization: `Bearer ${key}` } : {} })
  if (!res.ok)
    throw new Error(`${config.label} answered ${res.status}`)
  const json = await res.json() as { data?: Array<{ id: string }> }
  return (json.data ?? []).map(({ id }) => config.models.find(m => m.id === id) ?? { id, name: id, provider: config.id, input: ['text'], reasoning: false })
}

/**
 * The one entry point for a consumer-defined provider: any endpoint speaking the
 * OpenAI Chat Completions / Responses protocol. The catalog half (`Provider`)
 * is the same object minus `create` / `thinking`, so hand it to `withProvider` too.
 */
export function openaiCompatiblePreset(config: OpenAICompatibleConfig): ProviderPreset {
  return definePreset({
    id: config.id,
    label: config.label,
    byok: defineByokProvider({ id: config.id, label: config.label, env: config.env }),
    keyRequired: true,
    runtime: 'node',
    models: config.models,
    create: (model, key) => openaiCompatibleText(model, { baseURL: config.baseURL, apiKey: key ?? '', name: config.name ?? config.id, api: config.api }),
    thinking: config.thinking ?? openaiCompatibleThinking,
    discoverModels: key => discoverCompatibleModels(config, key),
  })
}
