import type { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import type { ComponentProps } from 'react'
import { Switch } from '#primitives/switch'

/**
 * The published Switch — Base UI's `Switch.Root` in shadcn's base-nova track,
 * promoted unchanged.
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
export type SwitchProps = ComponentProps<typeof Switch>
export type SwitchState = SwitchPrimitive.Root.State
/** `onCheckedChange`'s second argument — `reason` is always `'none'`. */
export type SwitchChangeEventDetails = SwitchPrimitive.Root.ChangeEventDetails

export { Switch }
