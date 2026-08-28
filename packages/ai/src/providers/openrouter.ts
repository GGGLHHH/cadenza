import { createOpenRouterText } from '@tanstack/ai-openrouter'
import { openrouter as data } from '../catalog/providers/openrouter'
import { definePreset } from '../server/preset'
import { openrouterThinking } from '../server/thinking'

// OpenRouter ids are open-ended (`vendor/model`), so the catalog is a suggestion list, not a gate.
export const openrouter = definePreset({
  ...data,
  create: (model, key) => createOpenRouterText(model as Parameters<typeof createOpenRouterText>[0], key ?? ''),
  thinking: openrouterThinking,
})
