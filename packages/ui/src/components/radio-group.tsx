import type { Radio } from '@base-ui/react/radio'
import type { RadioGroup as RadioGroupBase } from '@base-ui/react/radio-group'
import type { ReactElement } from 'react'
import {
  RadioGroupItem as RadioGroupItemPrimitive,
  RadioGroup as RadioGroupPrimitive,
} from '#primitives/radio-group'

export type RadioGroupProps<Value = string> = RadioGroupBase.Props<Value>
export type RadioGroupState = RadioGroupBase.State
/** `onValueChange`'s second argument — `reason` is always `'none'`. */
export type RadioGroupChangeEventDetails = RadioGroupBase.ChangeEventDetails
export type RadioGroupItemProps<Value = string> = Radio.Root.Props<Value>
export type RadioGroupItemState = Radio.Root.State

/**
 * The published RadioGroup — Base UI's `RadioGroup` owning the value, one
 * `RadioGroupItem` per choice.
 *
 * ```tsx
 * <FieldSet>
 *   <FieldLegend id="plan">套餐</FieldLegend>
 *   <RadioGroup aria-labelledby="plan" defaultValue="pro" name="plan">
 *     <Field orientation="horizontal">
 *       <RadioGroupItem id="plan-free" value="free" />
 *       <FieldLabel htmlFor="plan-free">免费版</FieldLabel>
 *     </Field>
 *     …
 *   </RadioGroup>
 * </FieldSet>
 * ```
 *
 * Two labelling jobs, and only one of them is automatic:
 *
 * - **Each item** is box-only exactly like `Checkbox` — `id` lands on its
 *   hidden input, a sibling `FieldLabel htmlFor` both toggles it and names it.
 * - **The group itself** is a bare `role="radiogroup"` div and needs
 *   `aria-labelledby` (or `aria-label`) pointing at the legend by hand. Base UI
 *   would wire that from *its* `Field.Root` / `Fieldset.Legend` contexts, but
 *   the seam's `FieldSet` / `FieldLegend` are shadcn's plain-DOM line — the two
 *   label channels do not meet, so an unlabelled group stays unlabelled.
 *
 * `value` / `defaultValue` / `onValueChange` live on the group; an item carries
 * only its `value`. The callback's second argument is a `ChangeEventDetails`
 * whose `reason` is always `'none'` and whose `cancel()` blocks the change.
 * With `name`, the group serializes natively through the items' hidden inputs.
 *
 * Both parts are re-declared as generic functions rather than re-exported: the
 * vendored wrappers type their props as `Props<any>`, which would hand every
 * caller an `any` in `value` and in `onValueChange`.
 *
 * `className` reaches a Base UI slot on both parts, so the `(state) => string`
 * form works — `RadioGroupState` (`disabled`, `readOnly`, `required` plus the
 * Field fields) for the group, `RadioGroupItemState` (those plus `checked`) for
 * an item. As on `Checkbox`, the Field fields only move inside a Base UI
 * `Field.Root`, which the seam's `Field` is not.
 */
export function RadioGroup<Value = string>(props: RadioGroupProps<Value>): ReactElement {
  return <RadioGroupPrimitive {...props} />
}

/**
 * One choice in a `RadioGroup`. Box-only: give it an `id` and point a sibling
 * `FieldLabel` at it. `value` identifies it within the group and is required.
 */
export function RadioGroupItem<Value = string>(props: RadioGroupItemProps<Value>): ReactElement {
  return <RadioGroupItemPrimitive {...props} />
}
