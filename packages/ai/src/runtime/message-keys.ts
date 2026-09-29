import type { UIMessage } from '@tanstack/ai-client'
import { useState } from 'react'

export interface MessageKeys {
  messages: readonly UIMessage[]
  /** message id → the React key it renders under. */
  keys: ReadonlyMap<string, string>
}

/**
 * Carries each message's key across a render. TanStack's stream processor
 * renames the optimistic assistant message to the server's `messageId` on the
 * first `TEXT_MESSAGE_START` — after any thinking or tool calls that streamed
 * into it. Keyed by `message.id`, the row remounts at that moment: a
 * `Reasoning` restarts its timer (every block reads "1s") and forgets that it
 * should fold. A message whose id is new, standing where the previous render
 * had a message of the same role whose id is now gone, is that rename and
 * keeps the old key.
 */
export function nextMessageKeys(previous: MessageKeys | undefined, messages: readonly UIMessage[]): MessageKeys {
  const ids = new Set(messages.map(m => m.id))
  const keys = new Map<string, string>()
  messages.forEach((message, index) => {
    const known = previous?.keys.get(message.id)
    const before = previous?.messages[index]
    const renamed = before !== undefined && before.role === message.role && !ids.has(before.id)
      ? previous?.keys.get(before.id)
      : undefined
    keys.set(message.id, known ?? renamed ?? message.id)
  })
  return { messages, keys }
}

/**
 * Stable React keys for a transcript: `key={keyOf(message)}` instead of
 * `key={message.id}`, so a message that TanStack renames mid-stream keeps its
 * row (see `nextMessageKeys`).
 */
export function useMessageKeys(messages: readonly UIMessage[]): (message: UIMessage) => string {
  const [state, setState] = useState(() => nextMessageKeys(undefined, messages))
  let current = state
  // Derived from the previous render, React's documented pattern for it: a
  // setState during render re-runs this component before the children commit.
  if (state.messages !== messages) {
    current = nextMessageKeys(state, messages)
    setState(current)
  }
  return message => current.keys.get(message.id) ?? message.id
}
