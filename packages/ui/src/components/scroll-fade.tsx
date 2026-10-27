'use client'

import type { UseScrollFadeOptions } from '@animate-ui/react/primitives/effects/scroll-fade'
import type { ReactElement } from 'react'
import { useScrollFade } from '@animate-ui/react/primitives/effects/scroll-fade'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useRef } from 'react'

export type ScrollFadeOrientation = 'vertical' | 'horizontal' | 'both'

/**
 * How the fade looks: `size` is the fade's depth in px (40), `shrink` how much
 * an item nearing the edge scales down (0.03), `blur` its blur in px (4),
 * `transition` how an edge settles when the content resizes.
 */
export type ScrollFadeOptions = Pick<UseScrollFadeOptions, 'blur' | 'shrink' | 'size' | 'transition'>

export type ScrollFadeProps = useRender.ComponentProps<'div'> & ScrollFadeOptions & {
  /** Which axes scroll and fade. The element mirrors it as `data-orientation`. */
  orientation?: ScrollFadeOrientation
}

const OVERFLOW = {
  both: { overflow: 'auto' },
  horizontal: { overflowX: 'auto' },
  vertical: { overflowY: 'auto' },
} as const

/**
 * A scrolling element whose content fades toward each edge that still has more
 * to scroll — animate-ui's scroll fade, which masks that edge and shrinks and
 * blurs the items nearing it. For a container that is not a `ScrollArea`;
 * `ScrollArea` takes the same fade through its `fade` prop, and keeps its
 * scrollbar out of the mask.
 *
 * Built on `useRender` rather than re-exporting animate-ui's component, whose
 * `asChild` is the Radix spelling of what Base UI calls `render`.
 */
export function ScrollFade({
  blur,
  orientation = 'vertical',
  ref,
  render,
  shrink,
  size,
  transition,
  ...props
}: ScrollFadeProps): ReactElement {
  const fadeRef = useRef<HTMLElement>(null)
  useScrollFade(fadeRef, { blur, orientation, shrink, size, transition })
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      { 'data-orientation': orientation, 'data-slot': 'scroll-fade', 'style': OVERFLOW[orientation] },
      props,
    ),
    ref: [fadeRef, ref],
    render,
  })
}
