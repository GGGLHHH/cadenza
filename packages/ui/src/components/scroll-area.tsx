'use client'

import type { ReactElement, Ref } from 'react'
import type { ScrollFadeOptions } from './scroll-fade'
import { useScrollFade } from '@animate-ui/react/primitives/effects/scroll-fade'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { useRef } from 'react'
import { cn } from '#lib/utils'

/**
 * Scrollbar visibility: `hover` (the default) reveals it while the pointer is
 * over the area or a scroll is in flight (Base UI's `data-hovering` /
 * `data-scrolling`), `always` keeps it on screen, `hidden` renders none.
 */
export type ScrollAreaScrollbars = 'always' | 'hover' | 'hidden'

export type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  /**
   * Fade the content toward each edge that still has more to scroll:
   * animate-ui's scroll fade masks that edge and shrinks and blurs the items
   * nearing it. `true` takes its defaults; an object tunes `size`, `shrink`,
   * `blur` or `transition`. The axes follow `orientation`.
   */
  fade?: boolean | ScrollFadeOptions
  /** Which scrollbars to render. The root mirrors it as `data-orientation`. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  scrollbars?: ScrollAreaScrollbars
  /**
   * Viewport class names. The function form receives
   * `ScrollAreaViewportState` (`scrolling`, `hasOverflowX/Y`, the four
   * overflow-edge flags).
   */
  viewportClassName?: ScrollAreaPrimitive.Viewport.Props['className']
  viewportRef?: Ref<HTMLDivElement>
  /**
   * Fuse the viewport with another component's element — Base UI's `render`
   * on the Viewport part. The element passed here *becomes* the scrolling
   * element: refs and handlers from both sides merge, and the render element's
   * own props win. `MessageScrollerViewport` is the precedent: shadcn's
   * headless transcript viewport must be the very element that scrolls, since
   * the scroller measures and anchors against it.
   */
  viewportRender?: ScrollAreaPrimitive.Viewport.Props['render']
  viewportStyle?: ScrollAreaPrimitive.Viewport.Props['style']
}

export type ScrollAreaScrollbarProps = ScrollAreaPrimitive.Scrollbar.Props

/**
 * Scroll container with overlay scrollbars rendered OUTSIDE the viewport
 * (Base UI structure: Root > Viewport + Scrollbar siblings). This exists
 * because a scroll fade is a mask on the scrolling element — a native
 * scrollbar lives inside that element and gets dimmed by the mask, while a
 * sibling scrollbar stays crisp. `fade` puts the mask on the viewport.
 */
export function ScrollArea({
  className,
  children,
  fade,
  orientation = 'vertical',
  scrollbars = 'hover',
  viewportClassName,
  viewportRef,
  viewportRender,
  viewportStyle,
  ...props
}: ScrollAreaProps): ReactElement {
  const fadeRef = useRef<HTMLDivElement>(null)
  useScrollFade(fadeRef, {
    ...(typeof fade === 'object' ? fade : undefined),
    enabled: Boolean(fade),
    orientation,
  })
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-orientation={orientation}
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // Claimed, not taken: the caller's ref still gets the element.
        ref={(node: HTMLDivElement | null) => {
          fadeRef.current = node
          if (typeof viewportRef === 'function')
            return viewportRef(node)
          if (viewportRef !== null && viewportRef !== undefined)
            viewportRef.current = node
        }}
        render={viewportRender}
        style={viewportStyle}
        className={cn(
          `
            rounded-[inherit] transition-[color,box-shadow] outline-none
            block-full inline-full
            focus-visible:ring-3 focus-visible:ring-ring/50
            focus-visible:outline-1
          `,
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {scrollbars !== 'hidden' && (
        <>
          {(orientation === 'vertical' || orientation === 'both') && (
            <ScrollAreaScrollbar className={hoverClassName(scrollbars)} orientation="vertical" />
          )}
          {(orientation === 'horizontal' || orientation === 'both') && (
            <ScrollAreaScrollbar className={hoverClassName(scrollbars)} orientation="horizontal" />
          )}
          <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
        </>
      )}
    </ScrollAreaPrimitive.Root>
  )
}

// An invisible bar never blocks clicks: data-hovering only exists while the
// pointer is inside the area, which is exactly when the bar is opaque.
function hoverClassName(scrollbars: ScrollAreaScrollbars): string | undefined {
  return scrollbars === 'hover'
    ? `
      opacity-0 transition-opacity duration-150
      data-hovering:opacity-100
      data-scrolling:opacity-100
    `
    : undefined
}

/**
 * A single scrollbar, for compositions that render their own — `ScrollArea`
 * renders these itself from `orientation`, so reaching for it directly is rare.
 * Named for its family (`ScrollArea` + Base UI's `Scrollbar` part), not
 * shadcn's bare `ScrollBar`.
 */
export function ScrollAreaScrollbar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaScrollbarProps): ReactElement {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        `
          flex touch-none p-px transition-colors select-none
          data-horizontal:flex-col data-horizontal:border-bs
          data-horizontal:border-bs-transparent data-horizontal:block-2.5
          data-vertical:border-s data-vertical:border-s-transparent
          data-vertical:block-full data-vertical:inline-2.5
        `,
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-border"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}
