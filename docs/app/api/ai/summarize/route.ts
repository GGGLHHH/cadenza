import type { OpenAIChatModel } from '@tanstack/ai-openai'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { createSummarizeHandler } from '@gedatou/cadenza-ai/server'
import { createOpenaiSummarize } from '@tanstack/ai-openai'

// Playground auto titles: BYOK like `/api/ai/chat`, OpenAI only. `key ?? ''`:
// `byok` is set, so the handler has already answered 401 when the key is missing.
export const maxDuration = 60

export const { POST } = createSummarizeHandler({
  adapter: (model, key) => createOpenaiSummarize(model as OpenAIChatModel, key ?? ''),
  byok: openai.byok ?? undefined,
  defaultModel: 'gpt-5.4-mini',
})
