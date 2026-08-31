import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-vercel-gateway 0.2.4 (model-meta.ts) — 升级 adapter 时 diff 这张表
// 该包的 meta 只有 id / 输入模态 / provider-options 类型：input = `VercelGatewayModelInputModalitiesByName`，
// reasoning = `VercelGatewayChatModelProviderOptionsByName[id]` Pick 了 'reasoning'；没有定价与上下文数据。
export const vercelGateway: Provider = {
  id: 'vercel-gateway',
  label: 'Vercel AI Gateway',
  byok: defineByokProvider({ id: 'vercel-gateway', label: 'Vercel AI Gateway', env: ['AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN'] }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'openai/gpt-5.2', name: 'OpenAI: GPT-5.2', provider: 'vercel-gateway', input: ['text', 'image', 'document'], reasoning: true },
    { id: 'anthropic/claude-sonnet-5', name: 'Anthropic: Claude Sonnet 5', provider: 'vercel-gateway', input: ['text', 'image', 'document'], reasoning: true },
    { id: 'google/gemini-3.5-flash', name: 'Google: Gemini 3.5 Flash', provider: 'vercel-gateway', input: ['text', 'image', 'document', 'video'], reasoning: true },
    { id: 'spacexai/grok-4.5', name: 'xAI: Grok 4.5', provider: 'vercel-gateway', input: ['text', 'image', 'document'], reasoning: true },
    { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek: DeepSeek V4 Pro', provider: 'vercel-gateway', input: ['text'], reasoning: true },
    { id: 'alibaba/qwen3-max', name: 'Alibaba: Qwen3 Max', provider: 'vercel-gateway', input: ['text'], reasoning: false },
    { id: 'meta/llama-4-maverick', name: 'Meta: Llama 4 Maverick', provider: 'vercel-gateway', input: ['text', 'image'], reasoning: false },
    { id: 'mistral/mistral-large-3', name: 'Mistral: Mistral Large 3', provider: 'vercel-gateway', input: ['text', 'image'], reasoning: false },
    { id: 'moonshotai/kimi-k3', name: 'MoonshotAI: Kimi K3', provider: 'vercel-gateway', input: ['text', 'image', 'document', 'video'], reasoning: true },
    { id: 'zai/glm-5.2', name: 'Z.ai: GLM 5.2', provider: 'vercel-gateway', input: ['text'], reasoning: true },
  ],
}
