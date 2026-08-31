import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-bedrock 0.3.2 (model-meta.ts → model-catalog.generated.ts) — 升级 adapter 时 diff 这张表
// 官方 `bedrockByok` 无 env，按 spec 自定义 bearer env。生成目录只有 id / input / apis：无定价、无上下文；
// Converse 默认路径没有推理参数 → 全部 reasoning:false。目录里没有 opus-4-5，Claude 取 sonnet-4-5 + haiku-4-5。
export const bedrock: Provider = {
  id: 'bedrock',
  label: 'Amazon Bedrock',
  byok: defineByokProvider({ id: 'bedrock', label: 'Amazon Bedrock', env: ['BEDROCK_API_KEY', 'AWS_BEARER_TOKEN_BEDROCK'] }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0', name: 'Claude Sonnet 4.5', provider: 'bedrock', input: ['text', 'image', 'document'], reasoning: false },
    { id: 'us.anthropic.claude-haiku-4-5-20251001-v1:0', name: 'Claude Haiku 4.5', provider: 'bedrock', input: ['text', 'image', 'document'], reasoning: false },
    { id: 'us.amazon.nova-pro-v1:0', name: 'Amazon Nova Pro', provider: 'bedrock', input: ['text', 'image', 'document'], reasoning: false },
    { id: 'us.amazon.nova-lite-v1:0', name: 'Amazon Nova Lite', provider: 'bedrock', input: ['text', 'image', 'document'], reasoning: false },
    { id: 'us.meta.llama4-maverick-17b-instruct-v1:0', name: 'Llama 4 Maverick 17B', provider: 'bedrock', input: ['text', 'image'], reasoning: false },
    { id: 'us.deepseek.r1-v1:0', name: 'DeepSeek R1', provider: 'bedrock', input: ['text'], reasoning: false },
  ],
}
