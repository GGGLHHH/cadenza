import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { bedrock } from '@gedatou/cadenza-ai/providers/bedrock'
import { deepseek } from '@gedatou/cadenza-ai/providers/deepseek'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { grok } from '@gedatou/cadenza-ai/providers/grok'
import { groq } from '@gedatou/cadenza-ai/providers/groq'
import { llmgateway } from '@gedatou/cadenza-ai/providers/llmgateway'
import { mistral } from '@gedatou/cadenza-ai/providers/mistral'
import { ollama } from '@gedatou/cadenza-ai/providers/ollama'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
import { vercelGateway } from '@gedatou/cadenza-ai/providers/vercel-gateway'
import { vertex } from '@gedatou/cadenza-ai/providers/vertex'
import { createTitleHandler } from '@gedatou/cadenza-ai/server'

// Thread titles come from the model the conversation itself uses (same BYOK
// header), so every preset the chat route knows is wired here too.
export const maxDuration = 60

export const { POST } = createTitleHandler({
  providers: [openai, anthropic, gemini, openrouter, grok, groq, mistral, vercelGateway, llmgateway, bedrock, vertex, ollama, deepseek],
  defaultModel: 'openai/gpt-5.2',
})
