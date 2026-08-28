// @vitest-environment node
import { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic'
import { anthropicByok } from '@tanstack/ai-anthropic/byok'
import { GEMINI_MODELS } from '@tanstack/ai-gemini'
import { geminiByok } from '@tanstack/ai-gemini/byok'
import { OPENAI_CHAT_MODELS } from '@tanstack/ai-openai'
import { openaiByok } from '@tanstack/ai-openai/byok'
import { openrouterByok } from '@tanstack/ai-openrouter/byok'
// The root entry only re-exports the tools/schema subset; the full id list lives on the subpath.
import { OPENROUTER_CHAT_MODELS } from '@tanstack/ai-openrouter/model-meta'
import { describe, expect, it } from 'vitest'
import { providers } from '../src/catalog'

// 元数据表是手抄的；adapter 升级删掉模型时这里先红。
const CASES = [
  ['openai', OPENAI_CHAT_MODELS, openaiByok],
  ['anthropic', ANTHROPIC_MODELS, anthropicByok],
  ['gemini', GEMINI_MODELS, geminiByok],
  ['openrouter', OPENROUTER_CHAT_MODELS, openrouterByok],
] as const

describe('catalog drift', () => {
  it.each(CASES)('%s: every catalog model id exists in the adapter constant', (id, ids, byok) => {
    const p = providers[id as keyof typeof providers]
    const set = new Set<string>(ids)
    for (const m of p.models)
      expect(set.has(m.id), `${id}/${m.id}`).toBe(true)
    expect(p.byok?.id).toBe(byok.id)
    expect(p.byok?.env).toEqual(byok.env)
  })
})
