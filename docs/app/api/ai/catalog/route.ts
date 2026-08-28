import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
import { createCatalogHandler } from '@gedatou/cadenza-ai/server'

export const { GET } = createCatalogHandler([openai, anthropic, gemini, openrouter])
