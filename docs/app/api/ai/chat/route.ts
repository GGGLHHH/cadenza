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
import { createChatHandler, toolDefinition } from '@gedatou/cadenza-ai/server'
import { z } from 'zod'

// Playground is pure BYOK (spec Q1): keys arrive per request in `x-byok-<provider>`
// headers; nothing is read from the deployment's env. `ollama` is dropped by the
// handler itself on Vercel (`runtime: 'local'`); `byteplus` is a placeholder and
// `openaiCompatiblePreset` needs a consumer's endpoint, so neither is wired.
export const maxDuration = 300

const getTime = toolDefinition({
  name: 'get_time',
  description: 'Current time in a timezone',
  inputSchema: z.object({ tz: z.string() }),
}).server(async ({ tz }) => ({ iso: new Date().toLocaleString('en-US', { timeZone: tz }) }))

export const { POST, GET } = createChatHandler({
  providers: [openai, anthropic, gemini, openrouter, grok, groq, mistral, vercelGateway, llmgateway, bedrock, vertex, ollama],
  defaultModel: 'openai/gpt-5.2',
  systemPrompts: ['You are the cadenza docs playground assistant. Keep answers short.'],
  tools: [getTime],
})
