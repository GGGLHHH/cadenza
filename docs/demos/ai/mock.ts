import type { ChatFetcher } from '@gedatou/cadenza-ai'
import type { Script, ScriptedOptions } from '@gedatou/cadenza-ai/mock'
import { scripted } from '@gedatou/cadenza-ai/mock'

// The one mock pattern every docs demo shares: the scripted transport answers
// as a real `text/event-stream` Response (the client parses it exactly as it
// would parse /api/ai/chat), text and reasoning arrive one character at a
// time at a fixed pace, and tool arguments are sliced into four-character
// pieces — so each demo shows the same streaming shape as production.
export const MOCK = {
  sse: true,
  chunk: 'char',
  pace: 12,
  argsChunk: 4,
} as const satisfies ScriptedOptions

export function mockFetcher(script: Script, options: ScriptedOptions = {}): ChatFetcher {
  return scripted(script, { ...MOCK, ...options })
}
