import type { ComponentProps, ReactElement } from 'react'
import { cn } from '#lib/utils'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel as FieldLabelPrimitive,
  FieldLegend as FieldLegendPrimitive,
  FieldSeparator,
  FieldSet,
  FieldTitle as FieldTitlePrimitive,
} from '#primitives/field'

/**
 * The published Field family — the layout and labelling shell every form control
 * sits in. shadcn's own composition, promoted unchanged: plain DOM elements with
 * `data-slot` hooks, no React Aria behaviour of its own.
 *
 * It matters here because the base-nova controls are *box-only*: a `Checkbox`,
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
 *   `data-invalid`; a control's `disabled` / `invalid` only styles the control.
 *   Set them on `Field` to grey out or redden the label and description.
 * - **`aria-describedby`.** `FieldDescription` and `FieldError` render text, they
 *   do not announce it. Give them ids and point the control at them, or render
 *   the control inside a Base UI `Field.Root` that owns the wiring.
 *
 * `FieldError` takes either `children` or an `errors` array of `{ message }`
 * objects — the shape form libraries hand back — dedupes it by message, renders a
 * single message bare and several as a list, and renders nothing when empty.
 *
 * `FieldTitle` is `FieldLabel` for groups with no single control to point at: it
 * is a `div`, not a `label`, but keeps `data-slot="field-label"` so the family's
 * layout selectors still match it.
 *
 * The three label-shaped parts (`FieldLabel`, `FieldLegend`, `FieldTitle`) are
 * the seam's thin wrap over the vendored ones: they add a `required` prop that
 * suffixes a red asterisk. The mark is visual only (`aria-hidden`) — the
 * semantic requiredness belongs on the control (`required` / `aria-required`).
 */
export type FieldProps = ComponentProps<typeof Field>
export type FieldContentProps = ComponentProps<typeof FieldContent>
export type FieldDescriptionProps = ComponentProps<typeof FieldDescription>
export type FieldErrorProps = ComponentProps<typeof FieldError>
export type FieldGroupProps = ComponentProps<typeof FieldGroup>
export type FieldSeparatorProps = ComponentProps<typeof FieldSeparator>
export type FieldSetProps = ComponentProps<typeof FieldSet>

export interface FieldLegendProps extends ComponentProps<typeof FieldLegendPrimitive> {
  /** 必填的视觉标记:文案后缀一个红色星号(`aria-hidden`)。语义必填走控件的 `required`/`aria-required`。 */
  required?: boolean
}
export interface FieldTitleProps extends ComponentProps<typeof FieldTitlePrimitive> {
  /** 必填的视觉标记:文案后缀一个红色星号(`aria-hidden`)。语义必填走控件的 `required`/`aria-required`。 */
  required?: boolean
}
// FieldLabel bottoms out in a plain <label>, so its props carry the ref already —
// unlike the React Aria Label this used to wrap, which declared the ref on the
// component type and needed it restated here.
export interface FieldLabelProps extends ComponentProps<typeof FieldLabelPrimitive> {
  /** 必填的视觉标记:文案后缀一个红色星号(`aria-hidden`)。语义必填走控件的 `required`/`aria-required`。 */
  required?: boolean
}

// 两种排版语境的间距统一到 gap-2(8px):FieldLabel/FieldTitle 是 flex gap-2,
// 星号作为 flex 项吃原生 gap;FieldLegend 是行内流,用 ms-2 补齐
function RequiredMark({ className }: { className?: string }): ReactElement {
  return (
    <span
      aria-hidden
      data-slot="field-required-mark"
      className={`
        text-destructive select-none
        ${className}
      `}
    >
      *
    </span>
  )
}

export function FieldLabel({ children, className, required, ...props }: FieldLabelProps): ReactElement {
  return (
    <FieldLabelPrimitive
      className={cn(`
        in-[[data-slot=field]:has([aria-required=true])]:not-has-data-[slot=field-required-mark]:after:text-destructive
        in-[[data-slot=field]:has([aria-required=true])]:not-has-data-[slot=field-required-mark]:after:content-["*"/""]
      `, className)}
      {...props}
    >
      {children}
      {required === true && <RequiredMark />}
    </FieldLabelPrimitive>
  )
}

export function FieldLegend({ children, className, required, ...props }: FieldLegendProps): ReactElement {
  return (
    <FieldLegendPrimitive
      className={cn(`
        in-[[data-slot=field-set]:has(>[aria-required=true])]:not-has-data-[slot=field-required-mark]:after:ms-2
        in-[[data-slot=field-set]:has(>[aria-required=true])]:not-has-data-[slot=field-required-mark]:after:text-destructive
        in-[[data-slot=field-set]:has(>[aria-required=true])]:not-has-data-[slot=field-required-mark]:after:content-["*"/""]
      `, className)}
      {...props}
    >
      {children}
      {required === true && <RequiredMark className="ms-2" />}
    </FieldLegendPrimitive>
  )
}

export function FieldTitle({ children, className, required, ...props }: FieldTitleProps): ReactElement {
  return (
    <FieldTitlePrimitive
      className={cn(`
        in-[[data-slot=field]:has([aria-required=true])]:not-has-data-[slot=field-required-mark]:after:text-destructive
        in-[[data-slot=field]:has([aria-required=true])]:not-has-data-[slot=field-required-mark]:after:content-["*"/""]
      `, className)}
      {...props}
    >
      {children}
      {required === true && <RequiredMark />}
    </FieldTitlePrimitive>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSeparator,
  FieldSet,
}
