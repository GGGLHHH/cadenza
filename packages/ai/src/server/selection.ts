import type { Model, ThinkingLevel } from '../catalog/types'
import type { ProviderPreset } from './preset'
import { parseModelRef } from '../catalog/catalog'
import { clampThinkingLevel, THINKING_LEVELS } from '../catalog/thinking'

export interface Selection {
  preset: ProviderPreset
  model: Model
  thinking: ThinkingLevel
}

// Vendor ids are `vendor/model`, `model:tag` (ollama) or `~vendor/alias` (openrouter).
const MODEL_ID = /^[\w.\-:/~]{1,200}$/

function bad(type: string): Response {
  return new Response(JSON.stringify({ error: { type } }), { status: 400, headers: { 'content-type': 'application/json' } })
}

/**
 * Read `provider` / `model` / `thinking` off `forwardedProps` — nothing else on
 * that object is trusted — and resolve them against the server-side presets.
 */
export function pickSelection(fp: Record<string, unknown>, presets: readonly ProviderPreset[], options: { defaultModel?: string }): Selection | Response {
  let provider = typeof fp.provider === 'string' ? fp.provider : undefined
  let modelId = typeof fp.model === 'string' ? fp.model : undefined
  if ((provider === undefined || modelId === undefined) && options.defaultModel !== undefined) {
    const d = parseModelRef(options.defaultModel)
    provider ??= d.provider
    modelId ??= d.id
  }
  if (provider === undefined || modelId === undefined || modelId === '')
    return bad('unknown_model')
  const preset = presets.find(p => p.id === provider)
  if (!preset)
    return bad('unknown_provider')
  if (!MODEL_ID.test(modelId))
    return bad('unknown_model')
  let model = preset.models.find(m => m.id === modelId)
  if (!model) {
    if (!preset.discoverModels)
      return bad('unknown_model')
    model = { id: modelId, name: modelId, provider: preset.id, input: ['text'], reasoning: false }
  }
  const raw = typeof fp.thinking === 'string' && (THINKING_LEVELS as readonly string[]).includes(fp.thinking) ? fp.thinking as ThinkingLevel : 'off'
  return { preset, model, thinking: clampThinkingLevel(model, raw) }
}
