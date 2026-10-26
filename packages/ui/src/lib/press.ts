import type { ComponentProps, ReactElement } from 'react'
import { Button as AnimatedButton } from '@animate-ui/react/primitives/buttons/button'
import { motionTokens } from '@animate-ui/react/utils/motion'
import { useReducedMotion } from 'motion/react'
import { createElement, useRef } from 'react'

/**
 * The vendored buttons' `transition-all` minus `transform`, which the press
 * owns: a CSS transition on it would chase every frame the spring writes and
 * smear it. animate-ui's own Button leaves `transform` out the same way;
 * `translate` stays for shadcn's press-down nudge. Put it before the caller's
 * `className` so theirs still wins.
 */
export const PRESS_TRANSITION
  = 'transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,box-shadow,opacity,translate]'

// A press shorter than this, in ms, gets the echo: about what animate-ui's
// press spring needs to reach its depth (measured: 100ms → 0.974 of 0.97).
const MIN_PRESS = 100

/**
 * Tap handlers that make a too-short press visible. animate-ui's presses are
 * `whileTap`: they last exactly as long as the press, and a trackpad
 * tap-to-click (or a keypress) releases within a frame or two, so the spring
 * turns back before it has moved. On such a release this plays the press once
 * through on the element's CSS `scale` — a property apart from the `transform`
 * animate-ui writes, so the two compose instead of fighting. A longer press is
 * animate-ui's alone.
 *
 * Spread onto anything that renders an animate-ui press (it reaches the Motion
 * element through Base UI's prop forwarding); `slot` finds that element from
 * the event, since Motion hands tap callbacks over a frame late.
 */
export function usePressEcho(slot: string): { onTap: (event: Event) => void, onTapCancel: (event: Event) => void, onTapStart: () => void } {
  const pressedAtRef = useRef(0)
  const reduce = useReducedMotion() === true
  const onRelease = (event: Event): void => {
    if (reduce || performance.now() - pressedAtRef.current >= MIN_PRESS)
      return
    const target = event.target instanceof Element ? event.target.closest(`[data-slot="${slot}"]`) : null
    target?.animate(
      [{ scale: '1' }, { scale: String(motionTokens.scale.press), offset: 0.35 }, { scale: '1' }],
      { duration: 280, easing: 'ease-out' },
    )
  }
  return {
    onTap: onRelease,
    onTapCancel: onRelease,
    onTapStart: () => {
      pressedAtRef.current = performance.now()
    },
  }
}

/**
 * animate-ui's button press around one of our buttons, through `asChild`, so
 * the button keeps its own element, `render` and props — plus the echo for a
 * too-short press (`usePressEcho`).
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
  const slot = children.props['data-slot'] ?? fallback
  const echo = usePressEcho(slot)
  // Typed apart from the call: `createElement`'s overloads reject a `data-*`
  // key in a literal, though the element takes it like any attribute.
  const props: ComponentProps<typeof AnimatedButton> & { 'data-slot': string } = {
    'asChild': true,
    children,
    'data-slot': slot,
    ...(inert ? { tapScale: 1 } : echo),
  }
  return createElement(AnimatedButton, props)
}
