import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-gemini 0.26.3 (model-meta.ts) — 升级 adapter 时 diff 这张表
// contextWindow = meta `max_input_tokens`（该包没有 `context_window` 字段）
export const gemini: Provider = {
  id: 'gemini',
  label: 'Google Gemini',
  byok: defineByokProvider({ id: 'gemini', label: 'Google Gemini', env: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'] }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'gemini', input: ['text', 'image', 'video', 'audio', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.75, output: 3.75, cacheRead: 0.075 } },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', input: ['text', 'image', 'video', 'audio', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 1.5, output: 7.5, cacheRead: 0.15 } },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'gemini', input: ['text', 'image', 'video', 'document', 'audio'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 1.5, output: 9, cacheRead: 0.15 } },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', provider: 'gemini', input: ['text', 'image', 'video', 'audio', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.3, output: 2.5, cacheRead: 0.03 } },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 2.5, output: 15 } },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.5, output: 3 } },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.25, output: 1.5 } },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite Preview', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.25, output: 1.5 } },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 2.5, output: 15 } },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', input: ['text', 'image', 'audio', 'video'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 1, output: 2.5 } },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini', input: ['text', 'image', 'audio', 'video', 'document'], reasoning: true, contextWindow: 1_048_576, maxOutputTokens: 65_536, cost: { input: 0.1, output: 0.4 } },
  ],
}
