import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
import { createChatHandler, toolDefinition } from '@gedatou/cadenza-ai/server'
import { z } from 'zod'

// Playground is pure BYOK (spec Q1): keys arrive per request in `x-byok-<provider>`
// headers; nothing is read from the deployment's env.
export const maxDuration = 300

const getTime = toolDefinition({
  name: 'get_time',
  description: 'Current time in a timezone',
  inputSchema: z.object({ tz: z.string() }),
}).server(async ({ tz }) => ({ iso: new Date().toLocaleString('en-US', { timeZone: tz }) }))

export const { POST, GET } = createChatHandler({
  providers: [openai, anthropic, gemini, openrouter],
  defaultModel: 'openai/gpt-5.2',
  systemPrompts: ['You are the cadenza docs playground assistant. Keep answers short.'],
  tools: [getTime],
})
