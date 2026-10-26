import type { ComponentProps, ReactElement } from 'react'
import { Button as AnimatedButton } from '@animate-ui/react/primitives/buttons/button'
import { motionTokens } from '@animate-ui/react/utils/motion'
import { animate, useReducedMotion } from 'motion/react'
import { createElement, useEffect, useRef } from 'react'

/**
 * The vendored buttons' `transition-all` minus `transform`, which the press
 * owns: a CSS transition on it would chase every frame the spring writes and
 * smear it. animate-ui's own Button leaves `transform` out the same way;
 * `translate` stays for shadcn's press-down nudge. Put it before the caller's
 * `className` so theirs still wins.
 */
export const PRESS_TRANSITION
  = 'transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,box-shadow,opacity,translate]'

// How long a press is held down at the least, in ms: about what animate-ui's
// press spring needs to reach its depth (measured: 100ms → 0.974 of 0.97).
const MIN_PRESS = 100

/**
 * animate-ui's button press around one of our buttons, through `asChild`, so
 * the button keeps its own element, `render` and props.
 *
 * Its slot writes `data-slot="button"` over the child's, so the child's own
 * slot is read back and handed in: `fallback` is the one the part writes when
 * the caller passes none. An `inert` button (disabled, pending) does not press.
 *
 * The press is animate-ui's — its scale and spring tokens — with one change:
 * it is held for at least `MIN_PRESS`. animate-ui's `whileTap` lasts exactly
 * as long as the press, and a trackpad tap-to-click releases within a frame
 * or two, so the spring turns back before it has moved. Here the release
 * waits out the rest of `MIN_PRESS`; a longer press is untouched. Tap events,
 * not pointer events, so Enter and Space press it too.
 *
 * Private: in `#lib`, never re-exported. `.ts` like the rest of `#lib`, hence
 * `createElement`.
 */
export function Press({ children, fallback, inert = false }: {
  children: ReactElement<{ 'data-slot'?: string }>
  fallback: string
  inert?: boolean
}): ReactElement {
  // Typed as a button for animate-ui's prop; `LinkButton` puts an anchor here,
  // and only `HTMLElement` is used.
  const ref = useRef<HTMLButtonElement>(null)
  const pressedAtRef = useRef(0)
  const releaseRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reduce = useReducedMotion() === true
  useEffect(() => () => clearTimeout(releaseRef.current), [])

  const scaleTo = (scale: number): void => {
    if (ref.current)
      animate(ref.current, { transform: `scale(${scale})` }, motionTokens.spring.press)
  }
  const onRelease = (): void => {
    clearTimeout(releaseRef.current)
    releaseRef.current = setTimeout(scaleTo, Math.max(0, MIN_PRESS - (performance.now() - pressedAtRef.current)), 1)
  }

  // Typed apart from the call: `createElement`'s overloads reject a `data-*`
  // key in a literal, though the element takes it like any attribute.
  const props: ComponentProps<typeof AnimatedButton> & { 'data-slot': string } = {
    'asChild': true,
    children,
    'data-slot': children.props['data-slot'] ?? fallback,
    ref,
    // animate-ui's own press, switched off: the handlers below replace it.
    'whileTap': undefined,
    ...(inert || reduce
      ? {}
      : {
          onTap: onRelease,
          onTapCancel: onRelease,
          onTapStart: () => {
            clearTimeout(releaseRef.current)
            pressedAtRef.current = performance.now()
            scaleTo(motionTokens.scale.press)
          },
        }),
  }
  return createElement(AnimatedButton, props)
}
