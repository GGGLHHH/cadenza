import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-grok 0.18.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
// grok-build-*：provider options 的 `reasoning?: never`，不发推理参数 → reasoning:false
export const grok: Provider = {
  id: 'grok',
  label: 'xAI Grok',
  byok: defineByokProvider({ id: 'grok', label: 'xAI Grok', env: 'XAI_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'grok-4.5', name: 'Grok 4.5', provider: 'grok', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 500_000, cost: { input: 2, output: 6, cacheRead: 0.3 } },
    { id: 'grok-4.6', name: 'Grok 4.6', provider: 'grok', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 500_000, cost: { input: 2, output: 6, cacheRead: 0.5 } },
    { id: 'grok-4.3', name: 'Grok 4.3', provider: 'grok', input: ['text', 'image'], reasoning: true, contextWindow: 1_000_000, cost: { input: 1.25, output: 2.5, cacheRead: 0.2 } },
    { id: 'grok-build-0.1', name: 'Grok Build 0.1', provider: 'grok', input: ['text', 'image'], reasoning: false, contextWindow: 256_000, cost: { input: 1, output: 2, cacheRead: 0.2 } },
  ],
}
