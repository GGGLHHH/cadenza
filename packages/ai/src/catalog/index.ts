import { createCatalog } from './catalog'
import { anthropic } from './providers/anthropic'
import { bedrock } from './providers/bedrock'
import { gemini } from './providers/gemini'
import { grok } from './providers/grok'
import { groq } from './providers/groq'
import { llmgateway } from './providers/llmgateway'
import { mistral } from './providers/mistral'
import { ollama } from './providers/ollama'
import { openai } from './providers/openai'
import { openrouter } from './providers/openrouter'
import { vercelGateway } from './providers/vercel-gateway'
import { vertex } from './providers/vertex'

export * from './catalog'
export * from './cost'
export * from './thinking'
export * from './types'

export const providers = { openai, anthropic, gemini, grok, groq, mistral, openrouter, vercelGateway, llmgateway, bedrock, vertex, ollama } as const
export const defaultCatalog = createCatalog(Object.values(providers))
