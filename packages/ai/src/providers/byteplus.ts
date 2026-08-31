import { defineByokProvider } from '@tanstack/ai/byok'
import { definePreset } from '../server/preset'
import { noThinking } from '../server/thinking'

// Reserved (spec: 13 + 1). `@tanstack/ai-byteplus` is not a peer yet; the preset
// keeps the slug and env names (ARK_API_KEY, then BYTEPLUS_API_KEY, per the
// adapter-configuration skill) so a later install is a one-line `create`.
export const byteplus = definePreset({
  id: 'byteplus',
  label: 'BytePlus',
  byok: defineByokProvider({ id: 'byteplus', label: 'BytePlus', env: ['ARK_API_KEY', 'BYTEPLUS_API_KEY'] }),
  keyRequired: true,
  runtime: 'node',
  models: [],
  create: () => {
    throw new Error('cadenza-ai: install @tanstack/ai-byteplus and define the preset with `definePreset` — the built-in `byteplus` is a placeholder.')
  },
  thinking: noThinking,
})
