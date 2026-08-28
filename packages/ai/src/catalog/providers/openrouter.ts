import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-openrouter 0.19.4 (model-meta.ts) — 升级 adapter 时 diff 这张表
// reasoning = `supports.supports` 含 'reasoning'。`pricing.text.input.cached` 在这张自动生成表里混用了
// cache-write 价（sonnet-5 2.7 > 2、qwen3-max 1.131 > 0.78）和 0（未知），只有 0 < cached < normal 时才抄成 cacheRead。
// 'openrouter/auto' 在常量数组里是裸字符串，没有元数据块。
export const openrouter: Provider = {
  id: 'openrouter',
  label: 'OpenRouter',
  byok: defineByokProvider({ id: 'openrouter', label: 'OpenRouter', env: 'OPENROUTER_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'openai/gpt-5.2', name: 'OpenAI: GPT-5.2', provider: 'openrouter', input: ['document', 'image', 'text'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 1.75, output: 14, cacheRead: 0.175 } },
    { id: 'anthropic/claude-sonnet-5', name: 'Anthropic: Claude Sonnet 5', provider: 'openrouter', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 1_000_000, maxOutputTokens: 128_000, cost: { input: 2, output: 10 } },
    { id: 'google/gemini-3.5-flash', name: 'Google: Gemini 3.5 Flash', provider: 'openrouter', input: ['text', 'image', 'video', 'document', 'audio'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 1.5, output: 9, cacheRead: 0.2333333333 } },
    { id: 'x-ai/grok-4.5', name: 'xAI: Grok 4.5', provider: 'openrouter', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 500_000, cost: { input: 2, output: 6, cacheRead: 0.3 } },
    { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek: DeepSeek V4 Pro', provider: 'openrouter', input: ['text'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 384_000, cost: { input: 0.790308, output: 1.580616, cacheRead: 0.065859 } },
    { id: 'qwen/qwen3-max', name: 'Qwen: Qwen3 Max', provider: 'openrouter', input: ['text'], reasoning: false, contextWindow: 262_144, maxOutputTokens: 65_536, cost: { input: 0.78, output: 3.9 } },
    { id: 'meta-llama/llama-4-maverick', name: 'Meta: Llama 4 Maverick', provider: 'openrouter', input: ['text', 'image'], reasoning: false, contextWindow: 1_048_576, maxOutputTokens: 16_384, cost: { input: 0.2, output: 0.8 } },
    { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'openrouter', input: ['text', 'document'], reasoning: false, contextWindow: 128_000, cost: { input: 2, output: 6, cacheRead: 0.2 } },
    { id: 'moonshotai/kimi-k3', name: 'MoonshotAI: Kimi K3', provider: 'openrouter', input: ['text', 'image', 'video'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 1_048_576, cost: { input: 3, output: 15, cacheRead: 0.3 } },
    { id: 'openrouter/auto', name: 'OpenRouter: Auto', provider: 'openrouter', input: ['text'], reasoning: false },
  ],
}
