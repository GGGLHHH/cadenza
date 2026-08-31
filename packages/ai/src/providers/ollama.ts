import type { Model } from '../catalog/types'
import { createOllamaChat, ollamaText } from '@tanstack/ai-ollama'
import { ollama as data } from '../catalog/providers/ollama'
import { definePreset } from '../server/preset'
import { ollamaThinking } from '../server/thinking'

// Mirrors the adapter's own env fallback (getOllamaHostFromEnv, not exported).
function defaultHost(): string {
  const host = process.env.OLLAMA_HOST
  return host !== undefined && host !== '' ? host : 'http://localhost:11434'
}

/** `GET {host}/api/tags` → one `Model` per installed tag; catalog metadata wins when the tag is known. */
export async function discoverOllamaModels(host: string): Promise<Model[]> {
  const res = await fetch(`${host.replace(/\/$/, '')}/api/tags`)
  if (!res.ok)
    throw new Error(`Ollama ${host} answered ${res.status}`)
  const json = await res.json() as { models?: Array<{ name: string }> }
  return (json.models ?? []).map(({ name }) => data.models.find(m => m.id === name) ?? { id: name, name, provider: 'ollama', input: ['text'], reasoning: false })
}

// The `x-byok-ollama` header carries the host URL, not a key (the chat handler
// has already checked it against `ollamaHosts`); without it the adapter reads OLLAMA_HOST.
export const ollama = definePreset({
  ...data,
  create: (model, key) => key !== null ? createOllamaChat(model, key) : ollamaText(model),
  thinking: ollamaThinking,
  discoverModels: key => discoverOllamaModels(key ?? defaultHost()),
})
