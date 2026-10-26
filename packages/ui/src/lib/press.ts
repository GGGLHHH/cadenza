import type { ComponentProps, ReactElement } from 'react'
import { Button as AnimatedButton } from '@animate-ui/react/primitives/buttons/button'
import { createElement } from 'react'

/**
 * animate-ui's button press around one of our buttons, through `asChild`, so
 * the button keeps its own element, `render` and props.
 *
 * Its slot writes `data-slot="button"` over the child's, so the child's own
 * slot is read back and handed in: `fallback` is the one the part writes when
 * the caller passes none. An `inert` button (disabled, pending) does not press.
 *
 * Private: in `#lib`, never re-exported. `.ts` like the rest of `#lib`, hence
 * `createElement`.
 */
export function Press({ children, fallback, inert = false }: {
  children: ReactElement<{ 'data-slot'?: string }>
  fallback: string
  inert?: boolean
}): ReactElement {
  // Typed apart from the call: `createElement`'s overloads reject a `data-*`
  // key in a literal, though the element takes it like any attribute.
  const props: ComponentProps<typeof AnimatedButton> & { 'data-slot': string } = {
    'asChild': true,
    children,
    'data-slot': children.props['data-slot'] ?? fallback,
    ...(inert ? { tapScale: 1 } : {}),
  }
  return createElement(AnimatedButton, props)
}
