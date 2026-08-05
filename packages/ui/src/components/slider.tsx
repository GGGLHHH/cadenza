import type { ReactElement } from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from '#lib/utils'

// `children` is omitted, not inherited: this file writes the whole inside
// (Control > Track > Indicator > Thumbs) as JSX literals, and JSX children
// always beat a spread's `props.children` — so an inherited `children` would
// have type-checked and then vanished without a warning. Style the parts
// through their `data-slot`s instead.
export type SliderProps<Value extends number | readonly number[] = number>
  = Omit<SliderPrimitive.Root.Props<Value>, 'children'>
export type SliderState = SliderPrimitive.Root.State
/** `onValueChange`'s second argument. Cancelable. */
export type SliderChangeEventDetails = SliderPrimitive.Root.ChangeEventDetails
/** `onValueCommitted`'s second argument — a commit notice, so no `cancel()`. */
export type SliderCommitEventDetails = SliderPrimitive.Root.CommitEventDetails

/**
 * The published Slider — Base UI's `Slider` in shadcn's base-nova skin.
 *
 * One value or a range, from the same component: a `number` renders one thumb,
 * an array renders one per entry.
 *
 * ```tsx
 * <Slider defaultValue={40} max={100} />
 * <Slider defaultValue={[25, 75]} />
 * ```
 *
 * This is the seam's own composition rather than a re-export, because the
 * vendored one counts thumbs off `Array.isArray(value)` and falls back to
 * `[min, max]` — so the single-value case, which is most of them, rendered
 * **two thumbs stacked on the same value**: one extra tab stop and a second
 * slider announced to a screen reader, for a control that has one value. Thumb
 * count here follows the value that is actually in play — with one boundary:
 * uncontrolled, Base UI reads `defaultValue` once at mount, so changing its
 * shape* later (scalar ↔ array, or a different length) moves the thumb count
 * without moving Base UI's values, and the stacked pair comes back. Changing
 * `defaultValue` after mount is a misuse React already warns about; controlled
 * `value` tracks correctly.
 *
 * - **Controlled triple** `value` / `defaultValue` / `onValueChange`, plus a
 *   separate `onValueCommitted` that fires once the drag or keypress settles —
 *   that is the one to hang an expensive request on. Change details are
 *   cancelable; commit details are a notice and are not.
 * - **`Value` does not degrade.** The generic follows what you pass, so a
 *   `defaultValue={40}` slider hands `onValueChange` a `number`, not a
 *   `number | readonly number[]` you have to narrow at every call site.
 * - **Form serialization** is Base UI's: `name` emits a hidden input per thumb.
 * - **The label goes through aria, not `htmlFor`.** The root is a `div`, which
 *   no `<label for>` can point at, and the thumbs' inputs take generated ids
 *   rather than the one you pass the root — so the usual `FieldLabel htmlFor`
 *   channel has nothing to attach to. Use **`aria-labelledby`** pointing at a
 *   `FieldTitle`'s id (`FieldTitle` is the label-shaped part for exactly this
 *   case: a heading with no control to associate) — Base UI forwards that one
 *   down to each thumb's input as well as naming the root group. `aria-label`
 *   names only the root; the thumbs stay anonymous under it, so keep it for
 *   sliders with no visible label at all.
 *
 * `className` reaches a Base UI slot, so the `(state) => string` form works,
 * with `SliderState` as that state. The parts underneath carry
 * `data-slot="slider-control" | "slider-track" | "slider-range" | "slider-thumb"`
 * for styling from the outside.
 */
export function Slider<Value extends number | readonly number[] = number>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderProps<Value>): ReactElement {
  // `??` not `||`: 0 is a legitimate value, and a falsy check would fall
  // through to the default and mis-count.
  const inPlay = value ?? defaultValue
  const thumbCount = Array.isArray(inPlay) ? inPlay.length : 1

  return (
    <SliderPrimitive.Root
      className={cn(`
        data-horizontal:inline-full
        data-vertical:block-full
      `, className)}
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment="edge"
      value={value}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={`
          relative flex touch-none items-center select-none inline-full
          data-disabled:opacity-50
          data-vertical:flex-col data-vertical:block-full
          data-vertical:inline-auto data-vertical:min-block-40
        `}
      >
        <SliderPrimitive.Track
          className={`
            relative grow overflow-hidden rounded-full bg-muted select-none
            data-horizontal:block-1 data-horizontal:inline-full
            data-vertical:block-full data-vertical:inline-1
          `}
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            className="
              bg-primary select-none
              data-horizontal:block-full
              data-vertical:inline-full
            "
            data-slot="slider-range"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            className={`
              relative block shrink-0 rounded-full border border-ring bg-white
              ring-ring/50 transition-[color,box-shadow] select-none block-3
              inline-3
              after:absolute after:-inset-2
              hover:ring-3
              focus-visible:ring-3 focus-visible:outline-hidden
              active:ring-3
              disabled:pointer-events-none disabled:opacity-50
            `}
            data-slot="slider-thumb"
            key={index}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
