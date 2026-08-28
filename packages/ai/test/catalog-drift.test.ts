// @vitest-environment node
import { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic'
import { anthropicByok } from '@tanstack/ai-anthropic/byok'
import { BEDROCK_CONVERSE_MODELS } from '@tanstack/ai-bedrock'
import { bedrockByok } from '@tanstack/ai-bedrock/byok'
import { GEMINI_MODELS } from '@tanstack/ai-gemini'
import { geminiByok } from '@tanstack/ai-gemini/byok'
import { GROK_CHAT_MODELS } from '@tanstack/ai-grok'
import { grokByok } from '@tanstack/ai-grok/byok'
import { GROQ_CHAT_MODELS } from '@tanstack/ai-groq'
import { groqByok } from '@tanstack/ai-groq/byok'
import { LLMGATEWAY_CHAT_MODELS } from '@tanstack/ai-llmgateway'
import { MISTRAL_CHAT_MODELS } from '@tanstack/ai-mistral'
import { mistralByok } from '@tanstack/ai-mistral/byok'
import { ollamaByok } from '@tanstack/ai-ollama/byok'
import { OPENAI_CHAT_MODELS } from '@tanstack/ai-openai'
import { openaiByok } from '@tanstack/ai-openai/byok'
import { openrouterByok } from '@tanstack/ai-openrouter/byok'
// The root entry only re-exports the tools/schema subset; the full id list lives on the subpath.
import { OPENROUTER_CHAT_MODELS } from '@tanstack/ai-openrouter/model-meta'
import { VERCEL_GATEWAY_CHAT_MODELS } from '@tanstack/ai-vercel-gateway'
import { vercelGatewayByok } from '@tanstack/ai-vercel-gateway/byok'
import { describe, expect, it } from 'vitest'
import { providers } from '../src/catalog'

// 元数据表是手抄的；adapter 升级删掉模型时这里先红。
// llmgateway 没有 ./byok 子路径（byok 按 spec 自定义）；bedrock 官方 byok 无 env，这里只对 id。
const CASES = [
  ['openai', OPENAI_CHAT_MODELS, openaiByok],
  ['anthropic', ANTHROPIC_MODELS, anthropicByok],
  ['gemini', GEMINI_MODELS, geminiByok],
  ['openrouter', OPENROUTER_CHAT_MODELS, openrouterByok],
  ['grok', GROK_CHAT_MODELS, grokByok],
  ['groq', GROQ_CHAT_MODELS, groqByok],
  ['mistral', MISTRAL_CHAT_MODELS, mistralByok],
  ['vercelGateway', VERCEL_GATEWAY_CHAT_MODELS, vercelGatewayByok],
  ['llmgateway', LLMGATEWAY_CHAT_MODELS, { id: 'llmgateway', env: ['LLM_GATEWAY_API_KEY'] }],
  ['bedrock', BEDROCK_CONVERSE_MODELS, { id: bedrockByok.id, env: ['BEDROCK_API_KEY', 'AWS_BEARER_TOKEN_BEDROCK'] }],
] as const

describe('catalog drift', () => {
  it.each(CASES)('%s: every catalog model id exists in the adapter constant', (id, ids, byok) => {
    const p = providers[id]
    const set = new Set<string>(ids)
    for (const m of p.models)
      expect(set.has(m.id), `${id}/${m.id}`).toBe(true)
    expect(p.byok?.id).toBe(byok.id)
    expect(p.byok?.env).toEqual(byok.env)
  })

  // vertex 复用 gemini 的模型表（上面已断言）；ollama 的 id 是开放的 `name:tag`，只对 byok。
  it('ollama / vertex: byok only', () => {
    expect(providers.ollama.byok).toMatchObject({ id: ollamaByok.id })
    expect(providers.ollama.byok?.env).toBeUndefined()
    expect(providers.vertex.byok).toMatchObject({ id: 'vertex', env: ['GOOGLE_VERTEX_API_KEY'] })
  })
})
