import type { BoundInterrupts, UIMessage } from '@tanstack/ai-client'
import type { TranscriptProviderProps } from '../src/view/transcript'
import { toolDefinition } from '@tanstack/ai/client'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PartRenderersProvider } from '../src/runtime/renderers'
import { Transcript, TranscriptActions, TranscriptError, TranscriptMessage, TranscriptParts, TranscriptProvider } from '../src/view/transcript'

const user = { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'Hi' }] } as UIMessage
const assistant = {
  id: 'a1',
  role: 'assistant',
  parts: [
    { type: 'thinking', content: 'hmm' },
    { type: 'tool-call', id: 'c1', name: 'get_weather', arguments: '{}', state: 'complete', output: { c: 1 } },
    { type: 'text', content: '**Bold**' },
  ],
} as UIMessage

// Type-level: what useChat({ tools: [move] }).interrupts holds must flow into the provider untouched.
const _move = toolDefinition({ name: 'move', description: 'Move a work', inputSchema: { type: 'object', additionalProperties: true }, needsApproval: true })
const typed = [] as unknown as BoundInterrupts<[typeof _move]>
const accepted: TranscriptProviderProps['interrupts'] = typed
void accepted

describe('transcript', () => {
  it('throws the branded error outside a provider', () => {
    expect(() => render(<Transcript><div /></Transcript>)).toThrow(/cadenza-ai: TranscriptContext is missing/)
  })

  it('renders rows with role attributes, dispatches parts, and hides actions while streaming', () => {
    const { container, rerender } = render(
      <TranscriptProvider status="ready">
        <Transcript>
          <TranscriptMessage message={user} />
          <TranscriptMessage message={assistant}>
            <TranscriptParts message={assistant} />
            <TranscriptActions><button type="button">Copy</button></TranscriptActions>
          </TranscriptMessage>
        </Transcript>
      </TranscriptProvider>,
    )
    const rows = container.querySelectorAll('[data-slot=transcript-message]')
    expect(rows).toHaveLength(2)
    expect(rows[0].getAttribute('data-role')).toBe('user')
    expect(rows[0].querySelector('[data-slot=bubble]')?.getAttribute('data-variant')).toBe('muted')
    expect(rows[1].querySelector('[data-slot=bubble]')?.getAttribute('data-variant')).toBe('ghost')
    expect(container.querySelector('[data-slot=reasoning]')).not.toBeNull()
    expect(container.querySelector('[data-slot=tool-call-card]')).not.toBeNull()
    expect(container.querySelector('[data-slot=markdown]')).not.toBeNull()
    // the toolbar is lifted out of the bubble into the message footer
    expect(rows[1].querySelector('[data-slot=bubble] [data-slot=transcript-actions]')).toBeNull()
    expect(container.querySelector('[data-slot=transcript-actions]')?.hasAttribute('data-hidden')).toBe(false)
    rerender(
      <TranscriptProvider status="streaming">
        <Transcript>
          <TranscriptMessage message={assistant} streaming>
            <TranscriptActions><button type="button">Copy</button></TranscriptActions>
          </TranscriptMessage>
        </Transcript>
      </TranscriptProvider>,
    )
    expect(container.querySelector('[data-slot=transcript-actions]')?.hasAttribute('data-hidden')).toBe(true)
    expect(container.querySelector('[data-slot=transcript-message]')?.hasAttribute('data-streaming')).toBe(true)
  })

  it('uses a registered tool renderer and groups consecutive tool calls', async () => {
    const two = {
      id: 'a2',
      role: 'assistant',
      parts: [
        { type: 'tool-call', id: 'x', name: 'a', arguments: '{}', state: 'complete' },
        { type: 'tool-result', toolCallId: 'x', content: '1' },
        { type: 'tool-call', id: 'y', name: 'b', arguments: '{}', state: 'complete' },
      ],
    } as UIMessage
    const { container } = render(
      <TranscriptProvider status="ready">
        <PartRenderersProvider renderers={{ toolCall: { a: () => <i data-testid="custom">A</i> } }}>
          <Transcript><TranscriptMessage message={two} /></Transcript>
        </PartRenderersProvider>
      </TranscriptProvider>,
    )
    expect(container.querySelector('[data-slot=tool-call-group]')?.getAttribute('data-count')).toBe('2')
    // the group folds by default; the panel mounts on open
    await userEvent.click(screen.getByText('Ran 2 tools'))
    expect(screen.getByTestId('custom')).toBeTruthy()
  })

  it('transcriptError exposes the code', () => {
    const err = Object.assign(new Error('Stopped'), { code: 'aborted' })
    const { container } = render(<TranscriptProvider status="error"><TranscriptError error={err}>Stopped</TranscriptError></TranscriptProvider>)
    const el = container.querySelector('[data-slot=transcript-error]')!
    expect(el.getAttribute('role')).toBe('alert')
    expect(el.getAttribute('data-code')).toBe('aborted')
  })
})

describe('transcript frame', () => {
  const user: UIMessage = { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'hi' }] }
  const assistant: UIMessage = { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'hello' }] }

  it('anchors only the latest user turn by default, and none when anchorTurns is false', () => {
    const earlier: UIMessage = { id: 'u0', role: 'user', parts: [{ type: 'text', content: 'earlier' }] }
    const { unmount } = render(
      <TranscriptProvider status="ready">
        <Transcript>
          <TranscriptMessage message={earlier} />
          <TranscriptMessage message={assistant} />
          <TranscriptMessage message={user} />
        </Transcript>
      </TranscriptProvider>,
    )
    const anchors = Array.from(document.querySelectorAll('[data-scroll-anchor=true]')).map(e => e.getAttribute('data-message-id'))
    expect(anchors).toEqual(['u1'])
    expect(document.querySelector('[data-role=assistant]')?.getAttribute('data-scroll-anchor')).toBe('false')
    unmount()
    render(
      <TranscriptProvider status="ready">
        <Transcript anchorTurns={false}>
          <TranscriptMessage message={user} />
        </Transcript>
      </TranscriptProvider>,
    )
    expect(document.querySelector('[data-role=user]')?.getAttribute('data-scroll-anchor')).toBe('false')
  })

  it('renders after beside the viewport, outside the log', () => {
    render(
      <TranscriptProvider status="ready">
        <Transcript after={<button type="button">Jump</button>}>
          <TranscriptMessage message={user} />
        </Transcript>
      </TranscriptProvider>,
    )
    const jump = screen.getByRole('button', { name: 'Jump' })
    expect(jump.closest('[role=log]')).toBeNull()
    expect(jump.closest('[data-slot=transcript]')).not.toBeNull()
  })
})
