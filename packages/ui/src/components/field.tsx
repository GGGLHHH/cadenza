import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import type { LabelProps } from 'react-aria-components'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel as FieldLabelPrimitive,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '#primitives/field'

/**
 * The published Field family — the layout and labelling shell every form control
 * sits in. shadcn's own composition, promoted unchanged: plain DOM elements with
 * `data-slot` hooks, no React Aria behaviour of its own.
 *
 * It matters here because the aria-nova controls are *box-only*: a `Checkbox`,
 * `Switch` or `RadioGroupItem` root is the control's own visual box, so its text
 * label does not go in `children` — it goes in a sibling `FieldLabel` pointed at
 * the control by `htmlFor`:
 *
 * ```tsx
 * <Field orientation="horizontal">
 *   <Checkbox id="terms" />
 *   <FieldLabel htmlFor="terms">Accept terms</FieldLabel>
 * </Field>
 * ```
 *
 * Two things the family deliberately does *not* do, both left to the caller (and
 * to the form layer built on top of it):
 *
 * - **State mirroring.** `Field` styles its text from its own `data-disabled` /
 *   `data-invalid`; a control's `isDisabled` / `isInvalid` only styles the
 *   control. Set them on `Field` to grey out or redden the label and description.
 * - **`aria-describedby`.** `FieldDescription` and `FieldError` render text, they
 *   do not announce it. Give them ids and point the control at them, or render
 *   the control inside a React Aria field component that owns the wiring.
 *
 * `FieldError` takes either `children` or an `errors` array of `{ message }`
 * objects — the shape form libraries hand back — dedupes it by message, renders a
 * single message bare and several as a list, and renders nothing when empty.
 *
 * `FieldTitle` is `FieldLabel` for groups with no single control to point at: it
 * is a `div`, not a `label`, but keeps `data-slot="field-label"` so the family's
 * layout selectors still match it.
 */
export type FieldProps = ComponentProps<typeof Field>
export type FieldContentProps = ComponentProps<typeof FieldContent>
export type FieldDescriptionProps = ComponentProps<typeof FieldDescription>
export type FieldErrorProps = ComponentProps<typeof FieldError>
export type FieldGroupProps = ComponentProps<typeof FieldGroup>
export type FieldLegendProps = ComponentProps<typeof FieldLegend>
export type FieldSeparatorProps = ComponentProps<typeof FieldSeparator>
export type FieldSetProps = ComponentProps<typeof FieldSet>
export type FieldTitleProps = ComponentProps<typeof FieldTitle>
export type FieldLabelProps = LabelProps & RefAttributes<HTMLLabelElement>

// FieldLabel bottoms out in React Aria's Label, which declares its ref on the
// component type rather than in LabelProps — so the primitive's own
// ComponentProps<typeof Label> signature drops it. The ref already reaches the
// label through the spread (React 19); only the type needs restating, so this is
// a cast, not a wrapper.
const FieldLabel = FieldLabelPrimitive as (props: FieldLabelProps) => ReactElement

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
