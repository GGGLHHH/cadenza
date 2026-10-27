import type { ComponentProps, ReactElement } from 'react'
import { Button as AnimatedButton } from '@animate-ui/react/primitives/buttons/button'
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

// A press shorter than this, in ms, is replayed at this length: about what
// animate-ui's press spring needs to reach its depth (100ms → 0.974 of 0.97).
export const MIN_PRESS = 100

// The pointer events `replayPress` dispatches, so the handlers that start a
// replay can tell them from a person's.
const replays = new WeakSet<Event>()

export function isReplay(event: Event): boolean {
  return replays.has(event)
}

/**
 * Presses `element` for `MIN_PRESS` through Motion's own press gesture, so
 * animate-ui plays its press exactly as for a held one — the button's spring,
 * the switch thumb's stretch and lean, all of it its own.
 *
 * animate-ui's presses are `whileTap`-style: they last exactly as long as the
 * press, and a trackpad tap-to-click (or a keypress) releases within a frame
 * or two, so the spring turns back before it has moved. A replay gives it the
 * length a held press has. The down event does not bubble — Motion listens on
 * the element itself — so React and the caller's handlers never see it; the up
 * event goes to `window`, where Motion waits for it.
 */
export function replayPress(element: Element): void {
  const init: PointerEventInit = { button: 0, isPrimary: true, pointerId: -1, pointerType: 'mouse' }
  // The element's own window, held from the press: the release lands after
  // MIN_PRESS, when a test environment may already have dropped the globals.
  const view = element.ownerDocument.defaultView
  if (!view)
    return
  const down = new view.PointerEvent('pointerdown', init)
  replays.add(down)
  element.dispatchEvent(down)
  setTimeout(() => {
    const up = new view.PointerEvent('pointerup', init)
    replays.add(up)
    view.dispatchEvent(up)
  }, MIN_PRESS)
}

/**
 * Motion tap handlers that replay a too-short press (`replayPress`). Spread
 * onto anything that renders an animate-ui `whileTap` press (it reaches the
 * Motion element through Base UI's prop forwarding); `slot` finds that element
 * from the event, since Motion hands tap callbacks over a frame late.
 */
export function usePressEcho(slot: string): { onTap: (event: Event) => void, onTapCancel: (event: Event) => void, onTapStart: (event: Event) => void } {
  const pressedAtRef = useRef(0)
  const reduce = useReducedMotion() === true
  const onRelease = (event: Event): void => {
    if (isReplay(event) || reduce || performance.now() - pressedAtRef.current >= MIN_PRESS)
      return
    const target = event.target instanceof Element ? event.target.closest(`[data-slot="${slot}"]`) : null
    if (target)
      replayPress(target)
  }
  return {
    onTap: onRelease,
    onTapCancel: onRelease,
    onTapStart: (event) => {
      if (!isReplay(event))
        pressedAtRef.current = performance.now()
    },
  }
}

/**
 * animate-ui's button press around one of our buttons, through `asChild`, so
 * the button keeps its own element, `render` and props — plus the replay of a
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
