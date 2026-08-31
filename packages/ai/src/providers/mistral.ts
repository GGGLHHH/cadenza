import type { MISTRAL_CHAT_MODELS } from '@tanstack/ai-mistral'
import { createMistralText } from '@tanstack/ai-mistral'
import { mistral as data } from '../catalog/providers/mistral'
import { definePreset } from '../server/preset'
import { noThinking } from '../server/thinking'

export const mistral = definePreset({
  ...data,
  create: (model, key) => createMistralText(model as (typeof MISTRAL_CHAT_MODELS)[number], key ?? ''),
  thinking: noThinking,
})
