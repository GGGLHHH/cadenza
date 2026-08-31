import type { OPENAI_CHAT_MODELS } from '@tanstack/ai-openai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { openai as data } from '../catalog/providers/openai'
import { definePreset } from '../server/preset'
import { openaiThinking } from '../server/thinking'

// `key ?? ''`: keyRequired is true, so the handler has already answered 401 when the key is missing.
export const openai = definePreset({
  ...data,
  create: (model, key) => createOpenaiChat(model as (typeof OPENAI_CHAT_MODELS)[number], key ?? ''),
  thinking: openaiThinking,
})
