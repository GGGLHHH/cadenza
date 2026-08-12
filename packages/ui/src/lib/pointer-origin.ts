// Where the pointer was when a popup trigger was last pressed, in viewport
// coordinates — the anchor a centred popup scales out of. Shared by `Dialog`
// and `AlertDialog`, which are the same Base UI popup underneath (Base UI's
// AlertDialog re-exports Dialog's Popup, Backdrop and Viewport verbatim).
//
// Module-level rather than a context, for two reasons: a trigger paired by
// `handle` need not live inside the root it opens, so there is no shared
// provider to hang it on; and only one popup is ever being opened at a given
// instant, so one slot is enough for both families.
//
// Not cleared after use, deliberately. A dialog opened from code (a controlled
// `open`, a failed save) then animates out of whatever was last clicked —
// usually the button that started the operation, which reads better than the
// screen centre.
let pointerOrigin: { x: number, y: number } | null = null

/**
 * Record the press position. Call from `pointerdown`, never `click`: Base UI
 * keeps `open` in an external store and `store.set` notifies the popup
 * synchronously from Base UI's own click handler, which merge order puts ahead
 * of a caller's. By `click` the popup has already painted with the PREVIOUS
 * anchor. `pointerdown` precedes it and lands in time.
 */
export function recordPointerOrigin(event: { clientX: number, clientY: number }): void {
  pointerOrigin = { x: event.clientX, y: event.clientY }
}

/**
 * Forget it, so the next open scales from the centre. Call from `keydown` on
 * the trigger — any key, not just Enter/Space: a trigger only receives keydown
 * while focused, and reaching it by keyboard at all means the stale pointer
 * position is no longer where the user's attention is.
 */
export function clearPointerOrigin(): void {
  pointerOrigin = null
}

// How small the popup starts. Small enough to read as "out of a point", not so
// small that a routine dialog feels like a stunt.
const FLIP_SCALE = 0.3

/**
 * Write `--dialog-flip` — the shrunk-and-translated transform both ends of the
 * entrance transition sit at — onto a popup's scroll viewport.
 *
 * A ref callback rather than a `style` prop, because the seam component does
 * not re-render when the popup opens: Base UI's `open` lives in an external
 * store that only its own parts subscribe to, so a value computed during our
 * render is always one opening stale. The ref fires when the viewport element
 * mounts, which happens on every open and lands in the commit phase — before
 * paint, and therefore before the transition's first frame.
 *
 * It goes on the viewport rather than the popup for two reasons: custom
 * properties inherit, so the popup reads it anyway; and the popup's `style`
 * belongs to the caller and may itself be a function of state, which is not
 * worth merging into when the cascade already does it.
 *
 * The popup is centred by `m-auto` in a viewport that fills the screen, so its
 * centre IS the screen centre — which makes "distance from the popup to the
 * pointer" simply "pointer minus screen centre", with nothing to measure.
 */
export function applyPointerFlip(element: HTMLElement | null): void {
  if (element === null) {
    return
  }
  if (pointerOrigin === null) {
    // Keyboard, SSR, or code-opened with nothing clicked yet: plain centre
    // scaling, the same fallback the vendored dialog always had.
    element.style.setProperty('--dialog-flip', `scale(0.95)`)
    return
  }
  const x = Math.round(pointerOrigin.x - window.innerWidth / 2)
  const y = Math.round(pointerOrigin.y - window.innerHeight / 2)
  element.style.setProperty('--dialog-flip', `translate(${x}px, ${y}px) scale(${FLIP_SCALE})`)
}
