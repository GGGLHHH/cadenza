import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-anthropic 0.18.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
// thinkingLevels：4.6 代只有 adaptive（无 effort 分级）→ ['off','medium']；Fable 5 不可关 → 最低 'low'
export const anthropic: Provider = {
  id: 'anthropic',
  label: 'Anthropic',
  byok: defineByokProvider({ id: 'anthropic', label: 'Anthropic', env: 'ANTHROPIC_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'claude-opus-5', name: 'Claude Opus 5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 5, output: 25, cacheRead: 0.5 } },
    { id: 'claude-opus-5-fast', name: 'Claude Opus 5 Fast', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 10, output: 50, cacheRead: 1 } },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 3, output: 15, cacheRead: 0.3 } },
    { id: 'claude-fable-5', name: 'Claude Fable 5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 10, output: 50, cacheRead: 1 }, thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'] },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 5, output: 25, cacheRead: 0.5 } },
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 5, output: 25, cacheRead: 0.5 } },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 128_000, cost: { input: 5, output: 25 }, thinkingLevels: ['off', 'medium'] },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 64_000, cost: { input: 3, output: 15 }, thinkingLevels: ['off', 'medium'] },
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 32_000, cost: { input: 15, output: 75 } },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 64_000, cost: { input: 3, output: 15 } },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 64_000, cost: { input: 1, output: 5 } },
    { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', provider: 'anthropic', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 64_000, cost: { input: 15, output: 75 } },
  ],
}
