import type { ComponentProps } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
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
 * The controls are React Aria's `Input` / `Button` / `TextArea` underneath, so
 * dropping them inside a RAC field (a `SearchField`, a `TextField`) wires them
 * up by context alone.
 */
export type InputGroupProps = ComponentProps<typeof InputGroup>
export type InputGroupAddonProps = ComponentProps<typeof InputGroupAddon>
export type InputGroupButtonProps = ComponentProps<typeof InputGroupButton>
export type InputGroupInputProps = ComponentProps<typeof InputGroupInput>
export type InputGroupTextProps = ComponentProps<typeof InputGroupText>
export type InputGroupTextareaProps = ComponentProps<typeof InputGroupTextarea>

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
}
