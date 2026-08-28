import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-llmgateway 0.1.4 (model-meta.ts) — 升级 adapter 时 diff 这张表
// 该包没有 ./byok 导出，byok 按 spec 自定义；maxOutputTokens = meta `max_completion_tokens`
export const llmgateway: Provider = {
  id: 'llmgateway',
  label: 'LLM Gateway',
  byok: defineByokProvider({ id: 'llmgateway', label: 'LLM Gateway', env: 'LLM_GATEWAY_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_050_000, maxOutputTokens: 128_000, cost: { input: 2.5, output: 15, cacheRead: 0.25 } },
    { id: 'gpt-5.5', name: 'GPT-5.5', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_050_000, maxOutputTokens: 128_000, cost: { input: 5, output: 30, cacheRead: 0.5 } },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 mini', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 0.75, output: 4.5, cacheRead: 0.075 } },
    { id: 'claude-opus-5', name: 'Claude Opus 5', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 5, output: 25, cacheRead: 0.5 } },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 2, output: 10, cacheRead: 0.2 } },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 200_000, maxOutputTokens: 64_000, cost: { input: 1, output: 5, cacheRead: 0.1 } },
    { id: 'gemini-pro-latest', name: 'Gemini Pro (latest)', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 2, output: 12, cacheRead: 0.2 } },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 1.5, output: 7.5, cacheRead: 0.15 } },
    { id: 'kimi-k3', name: 'Kimi K3', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 1_048_576, cost: { input: 3, output: 15, cacheRead: 0.3 } },
    { id: 'glm-5.2', name: 'GLM 5.2', provider: 'llmgateway', input: ['text'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 1.4, output: 4.4, cacheRead: 0.26 } },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'llmgateway', input: ['text'], reasoning: true, contextWindow: 1_050_000, maxOutputTokens: 393_216, cost: { input: 0.435, output: 0.87 } },
    { id: 'qwen3.7-max', name: 'Qwen3.7 Max', provider: 'llmgateway', input: ['text'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 65_536, cost: { input: 2.5, output: 7.5, cacheRead: 0.5 } },
    { id: 'minimax-m2.5', name: 'MiniMax M2.5', provider: 'llmgateway', input: ['text'], reasoning: true, contextWindow: 204_800, maxOutputTokens: 131_100, cost: { input: 0.3, output: 1.2, cacheRead: 0.03 } },
    { id: 'grok-4-5', name: 'Grok 4.5', provider: 'llmgateway', input: ['text', 'image'], reasoning: true, contextWindow: 500_000, cost: { input: 2, output: 6, cacheRead: 0.5 } },
  ],
}
