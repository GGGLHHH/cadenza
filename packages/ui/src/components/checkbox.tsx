import type { ReactElement } from 'react'
import { Checkbox as CheckboxPrimitive } from '@animate-ui/react/primitives/base-ui/checkbox'
import { cn } from '#lib/utils'
import { IndicatorCheck } from '../icons/indicator-check'

/**
 * The published Checkbox — Base UI's `Checkbox.Root` in shadcn's base-nova box.
 * The seam adds exactly one thing: a look for the mixed state (see
 * `indeterminate` below).
 *
 * It is *box-only*: the root renders a `<span role="checkbox">` with a hidden
 * `<input type="checkbox">` beside it, so the root **is** the tick box and
 * nothing else. The text goes in a sibling `FieldLabel` pointed at it:
 *
 * ```tsx
 * <Field orientation="horizontal">
 *   <Checkbox id="terms" name="terms" />
 *   <FieldLabel htmlFor="terms">同意条款</FieldLabel>
 * </Field>
 * ```
 *
 * One `htmlFor` buys both halves, and it is worth knowing why, because the
 * `id` does not land where it looks like it does: `id` goes on the **hidden
 * input** (the visible box keeps a generated one). So the native `<label for>`
 * forwards clicks to that input — which is what toggles the checkbox — while
 * Base UI reads `input.labels` back out and mirrors the label's id onto the box
 * as `aria-labelledby`, which is what names it for a screen reader. No second
 * `aria-label`, no seam-side click plumbing.
 *
 * - **Controlled triple** `checked` / `defaultChecked` / `onCheckedChange`. The
 *   callback's second argument is a real `ChangeEventDetails`: `reason` is
 *   always `'none'` (upstream ships no other reason for a checkbox) and
 *   `cancel()` is honoured — call it and the internal state never advances.
 * - **`indeterminate`** renders the mixed state (`aria-checked="mixed"`). It is
 *   a display state orthogonal to `checked`, not a third value. The dash is the
 *   seam's: base-nova only paints `data-checked`, so a mixed box came out
 *   unfilled with a *tick* still in it — indistinguishable from checked, and
 *   already shipping in `DataTable`'s select-all header. The default className
 *   below fills the box on `data-indeterminate` and swaps the glyph for a dash.
 * - **Form serialization is native**: given `name`, the hidden input submits
 *   `value` (`"on"` when unset) while ticked, and `uncheckedValue` — nothing,
 *   by default — while not.
 * - **`parent`** belongs to Base UI's `CheckboxGroup`, which this seam has not
 *   promoted — so leave it alone. Outside a group it does not merely sit inert:
 *   it clears the hidden input's `name` (the field vanishes from `FormData`),
 *   skips the `uncheckedValue` input, and stamps `data-parent=""` on the box.
 *   A select-all box computes `checked` / `indeterminate` itself instead.
 *
 * `className` reaches a Base UI slot, so the `(state) => string` form works.
 * That state is `CheckboxState`: `checked`, `indeterminate`, `disabled`,
 * `readOnly`, `required`, plus the Field state fields (`valid`, `touched`,
 * `dirty`, `filled`, `focused`) — the last group only moves inside a Base UI
 * `Field.Root`, which the seam's `Field` is not.
 *
 * `DataTable`'s selection column renders this same checkbox.
 */
export type CheckboxProps = CheckboxPrimitive.Root.Props
export type CheckboxState = CheckboxPrimitive.Root.State
/** `onCheckedChange`'s second argument — `reason` is always `'none'`. */
export type CheckboxChangeEventDetails = CheckboxPrimitive.Root.ChangeEventDetails

// The mixed state, which base-nova has no styling for: fill the box like a
// checked one, hide the baked-in tick, and draw the dash with `before` — the
// box renders its own indicator, so there is no child to swap. (`after` is
// taken: it is the enlarged hit area.)
//
// The `dark:` line is not redundant. The box carries `dark:bg-input/30`, which
// lands at the same specificity as `data-indeterminate:bg-primary` and later in
// the sheet — so in dark mode it wins and the fill never happens, leaving a
// near-black dash on a near-black box. shadcn hit the same wall on the checked
// state and answered it the same way (`dark:data-checked:bg-primary`).
const MIXED = `
  data-indeterminate:border-primary data-indeterminate:bg-primary
  dark:data-indeterminate:bg-primary
  data-indeterminate:text-primary-foreground
  data-indeterminate:[&_svg]:hidden
  data-indeterminate:before:absolute data-indeterminate:before:top-1/2
  data-indeterminate:before:left-1/2 data-indeterminate:before:block-0.5
  data-indeterminate:before:inline-2 data-indeterminate:before:-translate-x-1/2
  data-indeterminate:before:-translate-y-1/2 data-indeterminate:before:rounded-full
  data-indeterminate:before:bg-current data-indeterminate:before:content-['']
`

// The vendored box's classes. The vendored part cannot be reused: it renders
// Base UI's own Indicator, and the tick is drawn by animate-ui's, which
// strokes the check icon's path in with Motion.
const BOX = `
  peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px]
  border border-input transition-colors outline-none
  group-has-disabled/field:opacity-50
  after:absolute after:-inset-x-3 after:-inset-y-2
  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
  disabled:cursor-not-allowed disabled:opacity-50
  aria-invalid:border-destructive aria-invalid:ring-3
  aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary
  dark:bg-input/30 dark:aria-invalid:border-destructive/50
  dark:aria-invalid:ring-destructive/40
  data-checked:border-primary data-checked:bg-primary
  data-checked:text-primary-foreground dark:data-checked:bg-primary
`

export function Checkbox({ className, ...props }: CheckboxProps): ReactElement {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(BOX, MIXED, className)} {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="
          grid place-content-center text-current
          [&>svg]:block-3.5 [&>svg]:inline-3.5
        "
      >
        {/* The bare check: animate-ui's indicator animates it (see IndicatorCheck). */}
        <IndicatorCheck />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
