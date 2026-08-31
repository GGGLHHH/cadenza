import { vertexText } from '@tanstack/ai-vertex'
import { vertex as data } from '../catalog/providers/vertex'
import { definePreset } from '../server/preset'
import { geminiThinking } from '../server/thinking'

// keyRequired is false: with no `x-byok-vertex` header the adapter resolves
// GOOGLE_VERTEX_API_KEY, then project + location env, then ADC on its own.
export const vertex = definePreset({
  ...data,
  create: (model, key) => vertexText(model as Parameters<typeof vertexText>[0], key !== null ? { apiKey: key } : undefined),
  thinking: geminiThinking,
})
