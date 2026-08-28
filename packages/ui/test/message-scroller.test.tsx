import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../src/components/message-scroller'

/**
 * The one hand-built part in the family. Its correctness rests on Base UI's
 * render-element merge order — a claim that lives in comments unless a test
 * pins it. jsdom has no layout, so everything here reads as "nothing
 * overflows", which is itself the documented contract for `tabIndex`.
 */
function mount(viewportProps: Partial<Parameters<typeof MessageScrollerViewport>[0]> = {}) {
  const ref = createRef<HTMLDivElement>()
  const result = render(
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport ref={ref} {...viewportProps}>
          <MessageScrollerContent>
            <MessageScrollerItem messageId="m1">one</MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>,
  )
  const viewport = result.container.querySelector<HTMLElement>('[data-slot=message-scroller-viewport]')!
  return { ...result, ref, viewport }
}

describe('messageScrollerViewport', () => {
  it('is one element that is both the transcript viewport and the scroll-area viewport', () => {
    const { container, viewport, ref } = mount()
    // The render element's slot wins; ScrollArea's own `scroll-area-viewport`
    // must not survive as a second element.
    expect(viewport).not.toBeNull()
    expect(container.querySelector('[data-slot=scroll-area-viewport]')).toBeNull()
    // The shell around it is the library ScrollArea.
    expect(container.querySelector('[data-slot=scroll-area]')).not.toBeNull()
    // A caller ref merges rather than replacing either side's.
    expect(ref.current).toBe(viewport)
  })

  it('stays a named region: render-element props beat Base UI\'s role="presentation"', () => {
    const { viewport } = mount()
    expect(viewport.getAttribute('role')).toBe('region')
    expect(viewport.getAttribute('aria-label')).toBe('Messages')
  })

  it('takes no focus stop while nothing overflows', () => {
    const { viewport } = mount()
    expect(viewport.tabIndex).toBe(-1)
  })

  it('wraps the transcript in Base UI Content so growth is observed', () => {
    const { viewport } = mount()
    // Content is the part carrying the content-size observer; the transcript
    // log must sit inside it, not beside it.
    const content = viewport.querySelector('[role=presentation]')
    expect(content).not.toBeNull()
    expect(content!.contains(viewport.querySelector('[data-slot=message-scroller-content]'))).toBe(true)
  })

  it('resolves a function className against the viewport state', () => {
    const { viewport } = mount({ className: state => (state.scrolling ? 'is-scrolling' : 'is-still') })
    expect(viewport.className).toContain('is-still')
  })

  it('renders no scrollbar under scrollbars="hidden"', () => {
    const { container } = mount({ scrollbars: 'hidden' })
    expect(container.querySelector('[data-slot=scroll-area-scrollbar]')).toBeNull()
  })
})
