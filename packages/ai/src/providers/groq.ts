import type { GROQ_CHAT_MODELS } from '@tanstack/ai-groq'
import { createGroqText } from '@tanstack/ai-groq'
import { groq as data } from '../catalog/providers/groq'
import { definePreset } from '../server/preset'
import { groqThinking } from '../server/thinking'

export const groq = definePreset({
  ...data,
  create: (model, key) => createGroqText(model as (typeof GROQ_CHAT_MODELS)[number], key ?? ''),
  thinking: groqThinking,
})
