import process from 'node:process'
import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { bedrock } from '@gedatou/cadenza-ai/providers/bedrock'
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
import { createCatalogHandler } from '@gedatou/cadenza-ai/server'

// Same list as ./chat; the catalog handler does not drop `ollama` on Vercel by
// itself, so the Playground builds its catalog from what the server reports.
const onVercel = process.env.VERCEL === '1'
const presets = [openai, anthropic, gemini, openrouter, grok, groq, mistral, vercelGateway, llmgateway, bedrock, vertex, ollama]

export const { GET } = createCatalogHandler(presets.filter(p => !(onVercel && p.runtime === 'local')))
