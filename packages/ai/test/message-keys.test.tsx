import type { UIMessage } from '@tanstack/ai-client'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { nextMessageKeys, useMessageKeys } from '../src/runtime/message-keys'

const m = (id: string, role: 'user' | 'assistant' = 'assistant'): UIMessage => ({ id, role, parts: [] }) as UIMessage

describe('message keys', () => {
  it('keeps the key of a message TanStack renames in place', () => {
    const first = nextMessageKeys(undefined, [m('u1', 'user'), m('client-1')])
    // TEXT_MESSAGE_START swaps the optimistic id for the server's
    const renamed = nextMessageKeys(first, [m('u1', 'user'), m('server-1')])
    expect(renamed.keys.get('server-1')).toBe('client-1')
    // and it sticks for later renders
    expect(nextMessageKeys(renamed, [m('u1', 'user'), m('server-1')]).keys.get('server-1')).toBe('client-1')
  })

  it('does not inherit across a clear, a role change, or from a message that is still there', () => {
    const first = nextMessageKeys(undefined, [m('u1', 'user'), m('a1')])
    // chat.clear() renders the empty list before the next turn arrives
    const cleared = nextMessageKeys(first, [])
    expect(nextMessageKeys(cleared, [m('u2', 'user')]).keys.get('u2')).toBe('u2')
    // a different role in the old slot is a different message
    expect(nextMessageKeys(first, [m('u1', 'user'), m('u9', 'user')]).keys.get('u9')).toBe('u9')
    // appended after messages that are all still present
    expect(nextMessageKeys(first, [m('u1', 'user'), m('a1'), m('a2')]).keys.get('a2')).toBe('a2')
  })

  it('useMessageKeys returns the carried key after a rename', () => {
    const { result, rerender } = renderHook(({ messages }) => useMessageKeys(messages), { initialProps: { messages: [m('u1', 'user'), m('client-1')] } })
    expect(result.current(m('client-1'))).toBe('client-1')
    rerender({ messages: [m('u1', 'user'), m('server-1')] })
    expect(result.current(m('server-1'))).toBe('client-1')
  })
})
