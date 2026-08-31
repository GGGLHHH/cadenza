import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'
import { gemini } from './gemini'

// sourceVersion: @tanstack/ai-vertex 0.2.4 (no model-meta.ts; models mirror @tanstack/ai-gemini 0.26.3 model-meta.ts)
// vertexText 接受 GeminiTextModel，目录直接复用 gemini 的 11 个模型；ADC / express key 由 adapter 自己读 env → keyRequired:false
export const vertex: Provider = {
  id: 'vertex',
  label: 'Vertex AI',
  byok: defineByokProvider({ id: 'vertex', label: 'Vertex AI', env: ['GOOGLE_VERTEX_API_KEY'] }),
  keyRequired: false,
  runtime: 'node',
  models: gemini.models.map(m => ({ ...m, provider: 'vertex' })),
}
