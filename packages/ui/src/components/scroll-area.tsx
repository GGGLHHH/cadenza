'use client'

import type { CSSProperties, ReactElement, Ref } from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { cn } from '#lib/utils'

/**
 * Scrollbar visibility: `hover` (the default) reveals it while the pointer is
 * over the area or a scroll is in flight (Base UI's `data-hovering` /
 * `data-scrolling`), `always` keeps it on screen, `hidden` renders none.
 */
export type ScrollAreaScrollbars = 'always' | 'hover' | 'hidden'

/**
 * Scroll container with overlay scrollbars rendered OUTSIDE the viewport
 * (Base UI structure: Root > Viewport + Scrollbar siblings). This exists
 * because the scroll-fade utilities are mask-images on the scrolling element —
 * a native scrollbar lives inside that element and gets dimmed by the mask,
 * while a sibling scrollbar stays crisp. Put fade classes on the viewport via
 * `viewportClassName`, never on the root.
 */
export function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  scrollbars = 'hover',
  viewportClassName,
  viewportRef,
  viewportStyle,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  orientation?: 'vertical' | 'horizontal' | 'both'
  scrollbars?: ScrollAreaScrollbars
  viewportClassName?: string
  viewportRef?: Ref<HTMLDivElement>
  viewportStyle?: CSSProperties
}): ReactElement {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-orientation={orientation}
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={viewportRef}
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
            <ScrollBar className={hoverClassName(scrollbars)} orientation="vertical" />
          )}
          {(orientation === 'horizontal' || orientation === 'both') && (
            <ScrollBar className={hoverClassName(scrollbars)} orientation="horizontal" />
          )}
          <ScrollAreaPrimitive.Corner />
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

export function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props): ReactElement {
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
