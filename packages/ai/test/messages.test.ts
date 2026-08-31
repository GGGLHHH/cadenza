import type { UIMessage } from '@tanstack/ai-client'
import { describe, expect, it, vi } from 'vitest'
import { editAndResend, isThinkingComplete, messagesToMarkdown, messageText, sourcesOf } from '../src/runtime/messages'

function msg(id: string, role: 'user' | 'assistant', parts: unknown[]): UIMessage {
  return { id, role, parts } as UIMessage
}

describe('message helpers', () => {
  it('flattens text parts and skips tool calls', () => {
    const m = msg('a', 'assistant', [{ type: 'thinking', content: 'hmm' }, { type: 'text', content: 'Hello' }, { type: 'tool-call', id: 'c', name: 'x', arguments: '{}', state: 'complete' }, { type: 'text', content: 'world' }])
    expect(messageText(m)).toBe('Hello\n\nworld')
  })

  it('renders a markdown transcript', () => {
    const md = messagesToMarkdown([msg('u', 'user', [{ type: 'text', content: 'Hi' }]), msg('a', 'assistant', [{ type: 'thinking', content: 'why' }, { type: 'text', content: 'Hello' }])], { title: 'T', includeThinking: true })
    expect(md).toContain('# T')
    expect(md).toContain('**User**')
    expect(md).toContain('> why')
    expect(md).toContain('Hello')
    expect(messagesToMarkdown([msg('a', 'assistant', [{ type: 'thinking', content: 'why' }])])).not.toContain('why')
  })

  it('editAndResend stops, truncates before the edited user message and resends', async () => {
    const setMessages = vi.fn()
    const sendMessage = vi.fn(async () => {})
    const stop = vi.fn()
    const messages = [msg('u1', 'user', []), msg('a1', 'assistant', []), msg('u2', 'user', []), msg('a2', 'assistant', [])]
    await editAndResend({ messages, setMessages, sendMessage, stop, status: 'streaming' }, 'u2', 'again')
    expect(stop).toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalledWith(messages.slice(0, 2))
    expect(sendMessage).toHaveBeenCalledWith('again')
    await expect(editAndResend({ messages, setMessages, sendMessage, stop, status: 'ready' }, 'a1', 'x')).rejects.toThrow(/user message/)
  })

  it('decides thinking completeness three ways', () => {
    const streaming = msg('a', 'assistant', [{ type: 'thinking', content: 'x' }])
    expect(isThinkingComplete(streaming, 0, 'streaming')).toBe(false)
    expect(isThinkingComplete(streaming, 0, 'ready')).toBe(true)
    expect(isThinkingComplete(msg('a', 'assistant', [{ type: 'thinking', content: 'x' }, { type: 'text', content: 'y' }]), 0, 'streaming')).toBe(true)
    expect(isThinkingComplete(msg('a', 'assistant', [{ type: 'thinking', content: 'x', signature: 'sig' }]), 0, 'streaming')).toBe(true)
  })

  it('collects sources from explicit metadata and provider-executed search output, deduplicated', () => {
    const m = msg('a', 'assistant', [
      { type: 'tool-call', id: 'c1', name: 'web_search', arguments: '{}', state: 'complete', metadata: { providerExecuted: true, sources: [{ url: 'https://a', title: 'A' }] } },
      { type: 'tool-call', id: 'c2', name: 'web_search', arguments: '{}', state: 'complete', metadata: { providerExecuted: true }, output: [{ url: 'https://b', title: 'B' }, { url: 'https://a' }] },
      { type: 'tool-call', id: 'c3', name: 'web_search', arguments: '{}', state: 'complete', output: [{ url: 'https://c' }] },
    ])
    expect(sourcesOf(m).map(s => s.url)).toEqual(['https://a', 'https://b'])
  })
})
