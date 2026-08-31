import type { GEMINI_MODELS } from '@tanstack/ai-gemini'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { gemini as data } from '../catalog/providers/gemini'
import { definePreset } from '../server/preset'
import { geminiThinking } from '../server/thinking'

export const gemini = definePreset({
  ...data,
  create: (model, key) => createGeminiChat(model as (typeof GEMINI_MODELS)[number], key ?? ''),
  thinking: geminiThinking,
})
