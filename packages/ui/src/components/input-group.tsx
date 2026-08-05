import type { Input as BaseInput } from '@base-ui/react/input'
import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput as InputGroupInputPrimitive,
  InputGroupText,
  InputGroupTextarea,
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
 * The row and the textarea are plain DOM, so their props are the element's own
 * and `className` is honestly a string. The input is Base UI's `Input`, which
 * pairs itself with an enclosing `Field.Root` by context alone — no props to
 * thread — and the button is Base UI's `Button`.
 */
export type InputGroupProps = ComponentProps<typeof InputGroup>
export type InputGroupAddonProps = ComponentProps<typeof InputGroupAddon>
/**
 * `className` is narrowed to a string, like `Button`'s: the vendored button
 * funnels it through `cva`, which drops a function instead of resolving it —
 * and takes the variant classes down with it. Style off the `data-*` attributes
 * Base UI writes instead.
 */
export type InputGroupButtonProps
  = Omit<ComponentProps<typeof InputGroupButton>, 'className'> & { className?: string }
export type InputGroupTextProps = ComponentProps<typeof InputGroupText>
export type InputGroupTextareaProps = ComponentProps<typeof InputGroupTextarea>
export type InputGroupInputProps = BaseInput.Props & RefAttributes<HTMLInputElement>

// The primitive flattens the control to ComponentProps<'input'>, dropping the
// function className and the `onValueChange` / `defaultValue` that the Base UI
// Input underneath still honours. Every prop reaches it through plain spreads,
// so only the type needs widening — a cast, not a wrapper.
const InputGroupInput = InputGroupInputPrimitive as (props: InputGroupInputProps) => ReactElement

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
}
