'use client'

import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'
import { Switch as SwitchPrimitive } from '@animate-ui/react/primitives/base-ui/switch'
import { useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { MIN_PRESS } from '#lib/press'
import { cn, dataAttr } from '#lib/utils'
import { Spinner } from './spinner'

/**
 * The published Switch — the seam's own composition of Base UI's
 * `Switch.Root` + `Switch.Thumb`, not a re-export of the vendored primitive.
 * Why a fork: `pending`'s spinner lives *inside the thumb* (the antd
 * treatment), and the vendored file renders its Thumb as a closed explicit
 * child — no children channel, nothing a thin wrapper could reach. Class
 * names are copied from the vendored primitive; the only additions are the
 * thumb's centring layout and the pending spinner. The cost, owned here: this
 * file no longer follows upstream drift of primitives/switch.tsx.
 *
 * Same shape as `Checkbox` and the same *box-only* rule: the root is the track
 * (a `<span role="switch">` with a hidden `<input type="checkbox">` beside it),
 * so the text is a sibling `FieldLabel` pointed at it by `htmlFor`, and `id`
 * lands on that hidden input — see `Checkbox` for why one attribute covers both
 * the click and the accessible name.
 *
 * ```tsx
 * <Field orientation="horizontal">
 *   <Switch id="notify" name="notify" />
 *   <FieldLabel htmlFor="notify">邮件通知</FieldLabel>
 * </Field>
 * ```
 *
 * - **Controlled triple** `checked` / `defaultChecked` / `onCheckedChange`,
 *   second argument a `ChangeEventDetails` whose `reason` is always `'none'`
 *   and whose `cancel()` genuinely blocks the internal state change.
 * - **`pending`** marks an in-flight toggle (the server has not confirmed):
 *   the switch stays focusable but stops responding — the form controls'
 *   `readOnly` channel, the same "focusable but inert" Button assembles from
 *   `disabled` + `focusableWhenDisabled` — and a spinner turns inside the
 *   thumb. The action-plane word, same as `Button`; `loading` belongs to the
 *   content plane.
 * - **`size`** (`'default' | 'sm'`) is shadcn's, not Base UI's — it mirrors to
 *   `data-size` on the root and the thumb sizes itself off that.
 * - **Form serialization is native**, as on `Checkbox`: `name` + `value` +
 *   `uncheckedValue` on the hidden input.
 * - **No `indeterminate`.** A switch is on or off; that is the whole difference
 *   in behaviour from `Checkbox` — the rest is which one the affordance reads
 *   as, an immediate toggle (switch) versus a selection to be submitted
 *   (checkbox).
 *
 * `className` reaches a Base UI slot, so the `(state) => string` form works,
 * with `SwitchState` as that state.
 */
export type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default'
  /**
   * Marks the toggle as in flight: the switch stays focusable but stops
   * responding, and a spinner turns inside the thumb until the round-trip
   * settles.
   */
  pending?: boolean
}
export type SwitchState = SwitchPrimitive.Root.State
/** `onCheckedChange`'s second argument — `reason` is always `'none'`. */
export type SwitchChangeEventDetails = SwitchPrimitive.Root.ChangeEventDetails

/**
 * animate-ui stretches the thumb while the switch is held (its `width`, leaning
 * toward the track's middle through its `transform`). A trackpad tap releases
 * within a frame, before the stretch shows — so a release under `MIN_PRESS`
 * plays it once through on properties nothing else animates: `min-inline-size`
 * widens the thumb by animate-ui's 18.75%, a negative `margin-inline-start`
 * keeps the growth off the track's end (logical, so RTL needs nothing more).
 * Not `translate`: the vendored thumb rests on it (`translate-x-*` when
 * checked), and animating it would drop the thumb off its rest position. Pointer and key events, not Motion's tap
 * ones: animate-ui's root claims those for itself.
 */
const ECHO_ID = 'cadenza-switch-echo'

function useThumbStretchEcho(inert: boolean): {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onKeyUp: (event: KeyboardEvent<HTMLElement>) => void
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
} {
  const pressedAtRef = useRef(0)
  const naturalRef = useRef(0)
  const reduce = useReducedMotion() === true
  const thumbOf = (root: HTMLElement): HTMLElement | null => root.querySelector('[data-slot="switch-thumb"]')
  const start = (root: HTMLElement): void => {
    pressedAtRef.current = performance.now()
    // The thumb's width at rest, read now: by the release animate-ui's own
    // stretch has begun, and widening on top of it would overshoot.
    // A previous echo still playing (a quick second tap) would inflate it too.
    const thumb = thumbOf(root)
    thumb?.getAnimations().forEach((animation) => {
      if (animation.id === ECHO_ID)
        animation.cancel()
    })
    naturalRef.current = thumb?.offsetWidth ?? 0
  }
  const end = (root: HTMLElement): void => {
    if (inert || reduce || performance.now() - pressedAtRef.current >= MIN_PRESS)
      return
    // A frame on, so the thumb reads the state the tap just flipped it to.
    requestAnimationFrame(() => {
      const thumb = thumbOf(root)
      const natural = naturalRef.current
      if (!thumb)
        return
      const extra = Math.round(natural * 0.1875)
      // Checked rests at the track's inline end: grow back toward the start.
      const shift = thumb.hasAttribute('data-checked') ? -extra : 0
      thumb.animate(
        [
          { marginInlineStart: '0px', minInlineSize: `${natural}px` },
          { marginInlineStart: `${shift}px`, minInlineSize: `${natural + extra}px`, offset: 0.35 },
          { marginInlineStart: '0px', minInlineSize: `${natural}px` },
        ],
        { duration: 280, easing: 'ease-out', id: ECHO_ID },
      )
    })
  }
  const isPressKey = (event: KeyboardEvent<HTMLElement>): boolean => event.key === ' ' || event.key === 'Enter'
  return {
    onKeyDown: (event) => {
      if (isPressKey(event) && !event.repeat)
        start(event.currentTarget)
    },
    onKeyUp: (event) => {
      if (isPressKey(event))
        end(event.currentTarget)
    },
    onPointerDown: event => start(event.currentTarget),
    onPointerUp: event => end(event.currentTarget),
  }
}

export function Switch({
  className,
  onKeyDown,
  onKeyUp,
  onPointerDown,
  onPointerUp,
  pending,
  readOnly,
  size = 'default',
  ...props
}: SwitchProps): ReactElement {
  const echo = useThumbStretchEcho(props.disabled === true || readOnly === true || pending === true)
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      // Pending rides the readOnly channel: focus and tab order stay, the
      // toggle is suppressed upstream.
      readOnly={readOnly === true || pending === true}
      className={cn(
        // Copied from the vendored primitive (see fork note above), except that
        // enforce-canonical-classes collapsed its arbitrary px sizes onto the
        // spacing scale — inline-8 is calc(var(--spacing) * 8) = the same 32px.
        // block-[18.4px] stays arbitrary: 4.6 is not a scale step.
        `
          peer group/switch relative inline-flex shrink-0 items-center
          rounded-full border border-transparent transition-all outline-none
          after:absolute after:-inset-x-3 after:-inset-y-2
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/50
          aria-invalid:border-destructive aria-invalid:ring-3
          aria-invalid:ring-destructive/20
          data-[size=default]:block-[18.4px] data-[size=default]:inline-8
          data-[size=sm]:block-3.5 data-[size=sm]:inline-6
          dark:aria-invalid:border-destructive/50
          dark:aria-invalid:ring-destructive/40
          data-checked:bg-primary
          data-unchecked:bg-input
          dark:data-unchecked:bg-input/80
          data-disabled:cursor-not-allowed data-disabled:opacity-50
        `,
        'data-pending:cursor-wait',
        className,
      )}
      {...props}
      // Chained, so a caller's own pointer and key handlers still run.
      onKeyDown={(event) => {
        echo.onKeyDown(event)
        onKeyDown?.(event)
      }}
      onKeyUp={(event) => {
        echo.onKeyUp(event)
        onKeyUp?.(event)
      }}
      onPointerDown={(event) => {
        echo.onPointerDown(event)
        onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        echo.onPointerUp(event)
        onPointerUp?.(event)
      }}
      // Derived from `pending`, after the spread — same rule as Button: a
      // caller cannot half-set the state.
      aria-busy={pending === true || undefined}
      data-pending={dataAttr(pending)}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Copied from the vendored primitive (see fork note above) minus its
          // `transition-transform`: the translates only mark the two rest
          // positions now, and animate-ui's Thumb springs between them (and
          // stretches on press) with Motion.
          `
            pointer-events-none block rounded-full bg-background ring-0
            group-data-[size=default]/switch:block-4
            group-data-[size=default]/switch:inline-4
            group-data-[size=sm]/switch:block-3
            group-data-[size=sm]/switch:inline-3
            group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)]
            group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]
            dark:data-checked:bg-primary-foreground
            group-data-[size=default]/switch:data-unchecked:translate-x-0
            group-data-[size=sm]/switch:data-unchecked:translate-x-0
            dark:data-unchecked:bg-foreground
          `,
          // The fork's addition: the thumb can centre content.
          'grid place-items-center',
        )}
      >
        {pending === true && (
          <Spinner
            aria-hidden
            className={cn(
              'text-muted-foreground',
              size === 'sm'
                ? 'block-2 inline-2'
                : 'block-3 inline-3',
            )}
          />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
