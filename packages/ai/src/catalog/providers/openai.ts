import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-openai 0.22.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
// reasoning = `OpenAIChatModelProviderOptionsByName[id]` 含 `OpenAIReasoningOptions`
export const openai: Provider = {
  id: 'openai',
  label: 'OpenAI',
  byok: defineByokProvider({ id: 'openai', label: 'OpenAI', env: 'OPENAI_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'gpt-5.6', name: 'GPT-5.6', provider: 'openai', input: ['image', 'text'], reasoning: true, contextWindow: 1_050_000, maxOutputTokens: 128_000, cost: { input: 5, output: 30, cacheRead: 0.5 } },
    { id: 'gpt-5.5', name: 'GPT-5.5', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_050_000, maxOutputTokens: 128_000, cost: { input: 5, output: 30, cacheRead: 0.5 } },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 mini', provider: 'openai', input: ['image', 'text'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 0.75, output: 4.5, cacheRead: 0.075 } },
    { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 1.75, output: 14, cacheRead: 0.175 } },
    { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 1.25, output: 10, cacheRead: 0.125 } },
    { id: 'gpt-5', name: 'GPT-5', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 1.25, output: 10, cacheRead: 0.125 } },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', input: ['text', 'image', 'document'], reasoning: false, contextWindow: 1_047_576, maxOutputTokens: 32_768, cost: { input: 2, output: 8, cacheRead: 0.5 } },
    { id: 'o4-mini', name: 'o4-mini', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 100_000, cost: { input: 1.1, output: 4.4, cacheRead: 0.275 } },
  ],
}
