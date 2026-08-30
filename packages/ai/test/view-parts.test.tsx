import type { ToolApprovalInterrupt } from '@tanstack/ai-client'
import type { ToolCallPart } from '@tanstack/ai/client'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalActions, ApprovalApprove, ApprovalDeny } from '../src/view/approval'
import { MediaPart } from '../src/view/media-part'
import { Reasoning } from '../src/view/reasoning'
import { StructuredOutput } from '../src/view/structured-output'
import { ToolCallCard, ToolCallGroup, ToolCallGroupTrigger } from '../src/view/tool-call'

const q = (c: HTMLElement, s: string): HTMLElement | null => c.querySelector(s)

// jsdom has no Element.scrollTo; streamdown's code block calls it on mount.
Element.prototype.scrollTo = () => {}

describe('parts', () => {
  it('reasoning opens while incomplete, auto-collapses once on completion, and keeps a manual open', async () => {
    const { container, rerender } = render(<Reasoning content="hmm" complete={false}>Thinking</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-complete')).toBe(false)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
    rerender(<Reasoning content="hmm" complete>Thought</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-complete')).toBe(true)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(false)
    await userEvent.click(screen.getByText('Thought'))
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
    rerender(<Reasoning content="hmm" complete>Thought</Reasoning>)
    expect(q(container, '[data-slot=reasoning]')?.hasAttribute('data-open')).toBe(true)
  })

  it('keeps the panel mounted while collapsed so its height is measured after the content settles', () => {
    const part = { type: 'tool-call', id: 'c', name: 'get_time', arguments: '{"tz":"Asia/Shanghai"}', state: 'complete' } satisfies ToolCallPart
    const { container } = render(<ToolCallCard part={part} />)
    const panel = q(container, '[data-slot=collapsible-panel]')
    // Collapsed, but present: Base UI measures the panel the instant it is
    // revealed, and Markdown renders its code fence in a second pass. Mounting
    // it only on open would measure it mid-render, so the card animates to the
    // wrong height and corrects with a visible jump.
    expect(panel).not.toBeNull()
    expect(panel?.hasAttribute('hidden')).toBe(true)
    expect(panel?.textContent).toContain('Asia/Shanghai')
  })

  it('toolCallCard mirrors the seven tool states as named attributes', () => {
    const base = { type: 'tool-call', id: 'c', name: 'get_weather', arguments: '{"city":"Par' } satisfies Omit<ToolCallPart, 'state'>
    const { container, rerender } = render(<ToolCallCard part={{ ...base, state: 'input-streaming' }} />)
    const card = (): HTMLElement => q(container, '[data-slot=tool-call-card]')!
    expect(card().hasAttribute('data-pending')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'approval-requested' }} />)
    expect(card().hasAttribute('data-approval-requested')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'complete', arguments: '{"city":"Paris"}' }} />)
    expect(card().hasAttribute('data-complete')).toBe(true)
    rerender(<ToolCallCard part={{ ...base, state: 'error', arguments: '{}' }} />)
    expect(card().hasAttribute('data-error')).toBe(true)
    expect(screen.getByText('get_weather')).toBeTruthy()
  })

  it('toolCallGroup wraps its children behind a trigger', async () => {
    const { container } = render(
      <ToolCallGroup count={3}>
        <ToolCallGroupTrigger>Ran 3 tools</ToolCallGroupTrigger>
        <div>body</div>
      </ToolCallGroup>,
    )
    expect(q(container, '[data-slot=tool-call-group]')?.getAttribute('data-count')).toBe('3')
    await userEvent.click(screen.getByText('Ran 3 tools'))
    expect(screen.getByText('body')).toBeTruthy()
  })

  it('approvalActions resolves through the interrupt and disables once responded', async () => {
    const resolveInterrupt = vi.fn()
    const interrupt = { kind: 'tool-approval', status: 'pending', toolCallId: 'c', toolName: 'move', originalArgs: {}, resolveInterrupt } as unknown as ToolApprovalInterrupt
    const { rerender } = render(
      <ApprovalActions interrupt={interrupt}>
        <ApprovalApprove>Approve</ApprovalApprove>
        <ApprovalDeny>Deny</ApprovalDeny>
      </ApprovalActions>,
    )
    await userEvent.click(screen.getByText('Approve'))
    expect(resolveInterrupt).toHaveBeenCalledWith(true, { editedArgs: undefined })
    await userEvent.click(screen.getByText('Deny'))
    expect(resolveInterrupt).toHaveBeenCalledWith(false)
    rerender(
      <ApprovalActions interrupt={{ ...interrupt, status: 'submitting' }}>
        <ApprovalApprove>Approve</ApprovalApprove>
        <ApprovalDeny>Deny</ApprovalDeny>
      </ApprovalActions>,
    )
    expect(screen.getByText<HTMLButtonElement>('Approve').disabled).toBe(true)
  })

  it('mediaPart picks the element by part type', () => {
    const { container } = render(
      <>
        <MediaPart part={{ type: 'image', source: { type: 'data', mimeType: 'image/png', value: 'AQID' } }} />
        <MediaPart part={{ type: 'audio', source: { type: 'url', value: 'https://x/a.mp3' } }} />
        <MediaPart part={{ type: 'document', source: { type: 'data', mimeType: 'application/pdf', value: 'AA==' } }} />
      </>,
    )
    expect(q(container, 'img')?.getAttribute('src')).toBe('data:image/png;base64,AQID')
    expect(q(container, 'audio')?.getAttribute('src')).toBe('https://x/a.mp3')
    expect(q(container, '[data-slot=attachment-title]')?.textContent).toContain('pdf')
  })

  it('structuredOutput shows partial while streaming and data when complete', () => {
    const { container, rerender } = render(<StructuredOutput part={{ type: 'structured-output', status: 'streaming', partial: { a: 1 }, raw: '{"a":1' }} />)
    expect(q(container, '[data-slot=structured-output]')?.hasAttribute('data-streaming')).toBe(true)
    rerender(<StructuredOutput part={{ type: 'structured-output', status: 'complete', data: { a: 1 }, raw: '{"a":1}' }} />)
    expect(q(container, '[data-slot=structured-output]')?.hasAttribute('data-complete')).toBe(true)
  })
})
