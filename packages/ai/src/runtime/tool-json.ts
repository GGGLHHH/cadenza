// Internal: shared by `toolInput` and `ToolCallCard`, deliberately not re-exported from ./index.
import { parsePartialJSON } from '@tanstack/ai/client'

/**
 * A tool call's arguments as JSON, as far as they have streamed: the text
 * itself when nothing parses yet. `ToolCallCard` shows this raw fallback;
 * `toolInput` wants an object and drops it.
 */
export function parseToolJson(value: unknown): unknown {
  if (typeof value !== 'string')
    return value
  try {
    return parsePartialJSON(value) ?? value
  }
  catch {
    return value
  }
}
