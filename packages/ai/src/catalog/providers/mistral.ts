import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-mistral 0.5.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
// adapter 没有 thinking 设置项 → 全部 reasoning:false（thinkingLevels 隐含 ['off']），magistral 也不例外
export const mistral: Provider = {
  id: 'mistral',
  label: 'Mistral',
  byok: defineByokProvider({ id: 'mistral', label: 'Mistral', env: 'MISTRAL_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', input: ['text'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 8_192, cost: { input: 0.5, output: 1.5 } },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', input: ['text', 'image', 'document'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 8_192, cost: { input: 0.4, output: 2 } },
    { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', input: ['text', 'image', 'document'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 8_192, cost: { input: 0.1, output: 0.3 } },
    { id: 'magistral-medium-latest', name: 'Magistral Medium', provider: 'mistral', input: ['text'], reasoning: false, contextWindow: 40_000, maxOutputTokens: 40_000, cost: { input: 2, output: 5 } },
    { id: 'magistral-small-latest', name: 'Magistral Small', provider: 'mistral', input: ['text'], reasoning: false, contextWindow: 40_000, maxOutputTokens: 40_000, cost: { input: 0.5, output: 1.5 } },
    { id: 'pixtral-large-latest', name: 'Pixtral Large', provider: 'mistral', input: ['text', 'image', 'document'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 8_192, cost: { input: 2, output: 6 } },
  ],
}
