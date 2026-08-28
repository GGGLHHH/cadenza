import type { GROK_CHAT_MODELS } from '@tanstack/ai-grok'
import { createGrokText } from '@tanstack/ai-grok'
import { grok as data } from '../catalog/providers/grok'
import { definePreset } from '../server/preset'
import { grokThinking } from '../server/thinking'

export const grok = definePreset({
  ...data,
  create: (model, key) => createGrokText(model as (typeof GROK_CHAT_MODELS)[number], key ?? ''),
  thinking: grokThinking,
})
