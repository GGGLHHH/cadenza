import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import type { InputProps, TextAreaProps } from 'react-aria-components'
import {
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput as InputGroupInputPrimitive,
  InputGroup as InputGroupPrimitive,
  InputGroupText,
  InputGroupTextarea as InputGroupTextareaPrimitive,
} from '#primitives/input-group'

/**
 * The published InputGroup.
 *
 * An input with addons — leading icon, trailing button, a keyboard hint —
 * laid out as one bordered row that owns the focus ring. shadcn's own
 * composition, promoted unchanged: `SearchField` is built out of these, and
 * anything else that needs an adorned input should use them directly rather
 * than grow its own renamed copies.
 *
 * The controls are React Aria's `Input` / `Button` / `TextArea` underneath, so
 * dropping them inside a RAC field (a `SearchField`, a `TextField`) wires them
 * up by context alone.
 */
export type InputGroupProps = ComponentProps<typeof InputGroupPrimitive> & RefAttributes<HTMLDivElement>
export type InputGroupAddonProps = ComponentProps<typeof InputGroupAddon>
export type InputGroupButtonProps = ComponentProps<typeof InputGroupButton>
export type InputGroupInputProps = InputProps & RefAttributes<HTMLInputElement>
export type InputGroupTextProps = ComponentProps<typeof InputGroupText>
export type InputGroupTextareaProps = TextAreaProps & RefAttributes<HTMLTextAreaElement>

// The primitive types itself with bare `GroupProps`, which drops the ref half
// of RAC's public Group type. The ref itself already flows through the spread
// (React 19) — only the type needs restating, so this is a cast, not a wrapper.
const InputGroup = InputGroupPrimitive as (props: InputGroupProps) => ReactElement

// The primitive flattens both controls to ComponentProps<'input' | 'textarea'>,
// dropping the function className/style and the hover events that the RAC
// Input/TextArea underneath still honour — every prop reaches them through
// plain spreads, so only the types need widening. Casts, not wrappers.
const InputGroupInput = InputGroupInputPrimitive as (props: InputGroupInputProps) => ReactElement
const InputGroupTextarea = InputGroupTextareaPrimitive as (props: InputGroupTextareaProps) => ReactElement

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
}
