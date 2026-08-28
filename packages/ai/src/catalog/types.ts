import type { Modality, TokenUsage } from '@tanstack/ai'
import type { ByokProvider } from '@tanstack/ai/byok'

// `Modality` / `TokenUsage` live on the `@tanstack/ai` root (`export * from
// './types'`); the `./client` entry enumerates its exports and omits both.
// Type-only, so the browser bundle never touches the server package.
export type { Modality, TokenUsage }

/** 七级思考强度，顺序即强度；与 pi 的 `ModelThinkingLevel` 对齐（`'xhigh'` 是 Anthropic 4.7+ / OpenRouter / LLM Gateway 的真实档位）。 */
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** USD per 1M tokens. */
export interface ModelCost {
  input: number
  output: number
  cacheRead?: number
  cacheWrite?: number
}

export interface Model {
  id: string
  name: string
  provider: string
  input: readonly Modality[]
  reasoning: boolean
  contextWindow?: number
  maxOutputTokens?: number
  cost?: ModelCost
  /** 缺省 = `reasoning ? THINKING_LEVELS : ['off']`。 */
  thinkingLevels?: readonly ThinkingLevel[]
}

export interface Provider {
  /** BYOK slug（`x-byok-<id>` 头），必须匹配 `/^[a-z][a-z0-9-]{0,63}$/`。 */
  id: string
  label: string
  byok: ByokProvider | null
  /** false = 无 key 也能跑（vertex 走 ADC，ollama 走 env host）。 */
  keyRequired: boolean
  runtime: 'node' | 'local'
  models: readonly Model[]
}

export interface Catalog {
  readonly providers: readonly Provider[]
  readonly models: readonly Model[]
  getProvider: (id: string) => Provider | undefined
  getModel: (ref: string) => Model | undefined
  withProvider: (provider: Provider) => Catalog
  withoutProvider: (id: string) => Catalog
}
