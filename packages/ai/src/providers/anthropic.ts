import type { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic'
import { createAnthropicChat } from '@tanstack/ai-anthropic'
import { anthropic as data } from '../catalog/providers/anthropic'
import { definePreset } from '../server/preset'
import { anthropicThinking } from '../server/thinking'

export const anthropic = definePreset({
  ...data,
  create: (model, key) => createAnthropicChat(model as (typeof ANTHROPIC_MODELS)[number], key ?? ''),
  thinking: anthropicThinking,
})
