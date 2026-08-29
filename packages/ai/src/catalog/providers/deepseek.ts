import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @earendil-works/pi-ai 0.84.3 providers/data/deepseek.json — TanStack 没有 DeepSeek adapter，
// 型号 / 价格 / 上下文 / 档位从 pi 的生成表抄；升级 pi 时 diff 这张表。
// thinkingLevels = pi thinkingLevelMap 里非 null 的档（V4 Flash: low/high/max，V4 Pro: high/max）。
export const deepseek: Provider = {
  id: 'deepseek',
  label: 'DeepSeek',
  byok: defineByokProvider({ id: 'deepseek', label: 'DeepSeek', env: 'DEEPSEEK_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'deepseek', input: ['text'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 384_000, cost: { input: 0.14, output: 0.28, cacheRead: 0.0028 }, thinkingLevels: ['off', 'low', 'high', 'max'] },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'deepseek', input: ['text'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 384_000, cost: { input: 0.435, output: 0.87, cacheRead: 0.003625 }, thinkingLevels: ['off', 'high', 'max'] },
  ],
}
