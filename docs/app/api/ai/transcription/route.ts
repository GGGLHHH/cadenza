import type { OpenAITranscriptionModel } from '@tanstack/ai-openai'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { createTranscriptionHandler } from '@gedatou/cadenza-ai/server'
import { createOpenaiTranscription } from '@tanstack/ai-openai'

// Playground dictation: BYOK like `/api/ai/chat`, OpenAI only. `key ?? ''`:
// `byok` is set, so the handler has already answered 401 when the key is missing.
export const maxDuration = 60

export const { POST } = createTranscriptionHandler({
  adapter: (model, key) => createOpenaiTranscription(model as OpenAITranscriptionModel, key ?? ''),
  byok: openai.byok ?? undefined,
  defaultModel: 'gpt-4o-mini-transcribe',
})
