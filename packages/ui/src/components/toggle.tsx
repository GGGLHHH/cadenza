import type { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import type { VariantProps } from 'class-variance-authority'
import type { ReactElement } from 'react'
import { cn } from '#lib/utils'
import { Toggle as TogglePrimitiveStyled, toggleVariants } from '#primitives/toggle'

/**
 * Pressed and hovered must not look the same.
 *
 * base-nova paints both with `bg-muted` — and in this theme `--muted`,
 * `--accent` and `--secondary` are literally the same value, so no swap of
 * tokens can separate them. What is left is weight and shape:
 *
 * - hover, while **not** pressed, drops to a half-strength wash. Same variant
 *   and same twMerge group as the vendored `hover:bg-muted`, so it replaces it
 *   rather than piling on.
 * - pressed keeps the solid fill, and `data-pressed:hover:` restates it so the
 *   wash cannot dilute an already-pressed toggle (equal specificity otherwise —
 *   source order would decide it, which is not something to rely on).
 * - pressed also gains an inset ring. Fill strength alone is a ~1.5% lightness
 *   difference in a greyscale palette; the ring is what makes the state legible
 *   at a glance, and it survives a caller restyling the background.
 */
const PRESSED_APART = `
  hover:bg-muted/50
  data-pressed:bg-muted data-pressed:hover:bg-muted
  data-pressed:inset-ring data-pressed:inset-ring-border
`

export type ToggleState = TogglePrimitive.State
/** `onPressedChange`'s second argument. */
export type ToggleChangeEventDetails = TogglePrimitive.ChangeEventDetails

export type ToggleProps<Value extends string = string>
  = Omit<TogglePrimitive.Props<Value>, 'className'>
    & VariantProps<typeof toggleVariants>
    & {
    /**
     * The vendored toggle passes this *into* `cva`, whose `cx` is clsx — which
     * drops a function silently. The variant classes still come out; yours is
     * what goes missing. Narrowed to a string so the type does not promise a
     * contract this route cannot keep; style off `data-pressed` /
     * `data-disabled` instead of a render-props className. (Same route, same
     * narrowing, as `Button`. `ToggleGroupItem` routes through `cn` instead and
     * so keeps the function form.)
     */
      className?: string
    }

/**
 * The published Toggle — a button that stays pressed.
 *
 * Base UI's `Toggle` in shadcn's base-nova skin. It is a real
 * `<button aria-pressed>`, so it needs no label channel of its own: the
 * children (or an `aria-label`, when the children are just an icon) name it.
 *
 * ```tsx
 * <Toggle aria-label="加粗"><IconBold /></Toggle>
 * ```
 *
 * - **Controlled triple** `pressed` / `defaultPressed` / `onPressedChange`,
 *   second argument a cancelable `ChangeEventDetails`.
 * - **`variant`** (`'default' | 'outline'`) and **`size`** (`'default' | 'sm' |
 *   'lg'`) are shadcn's cva knobs, not Base UI's.
 * - **`value`** only matters inside a `ToggleGroup` — it is what identifies this
 *   toggle in the group's value array. Standalone, leave it off.
 *
 * A single toggle is a *button*, not a form field: nothing is submitted. Reach
 * for `Checkbox` or `Switch` when the state belongs to a form, and for
 * `ToggleGroup` when several toggles are related.
 *
 * The wrapper exists for one thing — telling pressed apart from hovered, see
 * `PRESSED_APART` above. The types do the rest: `className` narrowed for the
 * cva route, and the `Value` generic kept from collapsing to `string`
 * (`ComponentProps<typeof Toggle>` would instantiate it away). `Value` only
 * reaches `value?: Value` here, so it earns its keep the way §1.3 asks rather
 * than by doing anything visible — `ToggleGroupItem` types its own from Base UI
 * and never comes through here.
 */
export function Toggle<Value extends string = string>({
  className,
  ...props
}: ToggleProps<Value>): ReactElement {
  return <TogglePrimitiveStyled className={cn(PRESSED_APART, className)} {...props} />
}

export { toggleVariants }
