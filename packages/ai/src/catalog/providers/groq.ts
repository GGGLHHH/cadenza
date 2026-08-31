import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-groq 0.7.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
// maxOutputTokens = meta `max_completion_tokens`；reasoning = features 含 'reasoning'
export const groq: Provider = {
  id: 'groq',
  label: 'Groq',
  byok: defineByokProvider({ id: 'groq', label: 'Groq', env: 'GROQ_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', input: ['text'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 32_768, cost: { input: 0.59, output: 0.79 } },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', input: ['text'], reasoning: false, contextWindow: 131_072, maxOutputTokens: 131_072, cost: { input: 0.05, output: 0.08 } },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'groq', input: ['text'], reasoning: true, contextWindow: 131_072, maxOutputTokens: 65_536, cost: { input: 0.15, output: 0.6, cacheRead: 0.075 } },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'groq', input: ['text'], reasoning: true, contextWindow: 131_072, maxOutputTokens: 65_536, cost: { input: 0.075, output: 0.3, cacheRead: 0.037 } },
    { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'groq', input: ['text'], reasoning: true, contextWindow: 131_072, maxOutputTokens: 40_960, cost: { input: 0.29, output: 0.59 } },
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 Instruct 0905', provider: 'groq', input: ['text'], reasoning: false, contextWindow: 262_144, maxOutputTokens: 16_384, cost: { input: 1, output: 3, cacheRead: 0.5 } },
  ],
}
