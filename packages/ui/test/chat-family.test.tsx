import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Attachment,
  AttachmentAction,
  AttachmentMedia,
  AttachmentTitle,
} from '../src/components/attachment'
import { Bubble, BubbleContent } from '../src/components/bubble'
import { Marker, MarkerContent, MarkerIcon } from '../src/components/marker'
import { Message, MessageAvatar, MessageContent, MessageFooter } from '../src/components/message'

function slot(root: HTMLElement, name: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-slot=${name}]`)
}

describe('bubble', () => {
  it('puts the surface on the content, and the box rules on the root', () => {
    const { container } = render(
      <Bubble variant="ghost">
        <BubbleContent>text</BubbleContent>
      </Bubble>,
    )
    const root = slot(container, 'bubble')!
    // The variant is mirrored for styling, and `ghost` reaches the root to
    // escape the 80% cap — the one place a variant is not content-only.
    expect(root.dataset.variant).toBe('ghost')
    expect(root.className).toContain('data-[variant=ghost]:max-w-full')
    expect(slot(container, 'bubble-content')).not.toBeNull()
  })

  it('renders the content as any element through render', () => {
    const { container } = render(
      <Bubble>
        <BubbleContent render={<button type="button" />}>press</BubbleContent>
      </Bubble>,
    )
    expect(slot(container, 'bubble-content')?.tagName).toBe('BUTTON')
  })
})

describe('message', () => {
  it('drives alignment from the row alone', () => {
    const { container } = render(
      <Message align="end">
        <MessageAvatar />
        <MessageContent>
          <MessageFooter>read</MessageFooter>
        </MessageContent>
      </Message>,
    )
    expect(slot(container, 'message')?.dataset.align).toBe('end')
    // The avatar lifts clear of a footer, which is why it probes for one.
    expect(slot(container, 'message-avatar')?.className)
      .toContain('group-has-data-[slot=message-footer]/message:-translate-y-8')
  })
})

describe('marker', () => {
  it('hides the icon from assistive tech and mirrors the variant', () => {
    const { container } = render(
      <Marker variant="separator">
        <MarkerIcon>*</MarkerIcon>
        <MarkerContent>Today</MarkerContent>
      </Marker>,
    )
    expect(slot(container, 'marker')?.dataset.variant).toBe('separator')
    expect(slot(container, 'marker-icon')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('becomes a real element through render', () => {
    const { container } = render(
      <Marker render={<a href="#x" />}>
        <MarkerContent>open</MarkerContent>
      </Marker>,
    )
    expect(slot(container, 'marker')?.tagName).toBe('A')
  })
})

describe('attachment', () => {
  it('publishes state, size and orientation as the hooks every part follows', () => {
    const { container } = render(
      <Attachment orientation="vertical" size="xs" state="uploading">
        <AttachmentMedia variant="image" />
        <AttachmentTitle>f.pdf</AttachmentTitle>
      </Attachment>,
    )
    const root = slot(container, 'attachment')!
    expect(root.dataset.state).toBe('uploading')
    expect(root.dataset.size).toBe('xs')
    expect(root.dataset.orientation).toBe('vertical')
    // Only an image media dims; the title shimmers while bytes move.
    expect(slot(container, 'attachment-media')?.className).toContain('opacity-60')
    expect(slot(container, 'attachment-title')?.className)
      .toContain('group-data-[state=uploading]/attachment:shimmer')
  })

  it('keeps a string className on the action, which cva would otherwise swallow', () => {
    const { container } = render(
      <Attachment>
        <AttachmentAction aria-label="remove" className="mbs-2" />
      </Attachment>,
    )
    expect(slot(container, 'attachment-action')?.className).toContain('mbs-2')

    // The narrowing is the point: this part routes className through
    // buttonVariants → cva → clsx, which returns '' for a function. Typing the
    // function form here would be the half-open door §3 forbids.
    // @ts-expect-error className is narrowed to a string on this part
    expect(() => <AttachmentAction aria-label="x" className={() => 'nope'} />).toBeTypeOf('function')
  })
})
