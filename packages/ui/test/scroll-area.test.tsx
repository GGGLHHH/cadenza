import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ScrollArea } from '../src/components/scroll-area'

beforeAll(() => {
  // Fires once on observe: Base UI measures overflow inside the RO callback,
  // and without a callback it never mounts any scrollbar.
  vi.stubGlobal('ResizeObserver', class {
    private readonly callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    observe(target: Element): void {
      this.callback(
        [{ target } as ResizeObserverEntry],
        this,
      )
    }

    unobserve(): void {}
    disconnect(): void {}
  })
  // Base UI's ScrollArea polls viewport.getAnimations(), absent in jsdom.
  Element.prototype.getAnimations = () => []
  // Base UI unmounts scrollbars when nothing overflows; layout-less jsdom
  // reports 0/0 everywhere, so fake an overflowing viewport.
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => 300,
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => 300,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 100,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 100,
  })
})

function scrollbarsIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot=scroll-area-scrollbar]')]
}

describe('scrollArea scrollbars enum', () => {
  it('defaults to hover: bar present but transparent until hovering/scrolling', () => {
    const { container } = render(<ScrollArea>content</ScrollArea>)
    const [bar] = scrollbarsIn(container)
    expect(bar).toBeDefined()
    expect(bar.className).toContain('opacity-0')
    expect(bar.className).toContain('data-hovering:opacity-100')
    expect(bar.className).toContain('data-scrolling:opacity-100')
  })

  it('renders both bars for orientation=both', () => {
    const { container } = render(<ScrollArea orientation="both">content</ScrollArea>)
    expect(scrollbarsIn(container)).toHaveLength(2)
  })

  it('renders no scrollbar at all when hidden', () => {
    const { container } = render(<ScrollArea scrollbars="hidden">content</ScrollArea>)
    expect(scrollbarsIn(container)).toHaveLength(0)
  })

  it('always mode skips the hover fade classes', () => {
    const { container } = render(<ScrollArea scrollbars="always">content</ScrollArea>)
    const [bar] = scrollbarsIn(container)
    expect(bar).toBeDefined()
    expect(bar.className).not.toContain('opacity-0')
  })
})
