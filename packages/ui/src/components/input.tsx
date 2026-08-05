import type { Input as InputPrimitive } from '@base-ui/react/input'
import type { ReactElement, RefAttributes } from 'react'
import { Input as InputPrimitiveStyled } from '#primitives/input'

export type InputState = InputPrimitive.State
/** `onValueChange`'s second argument. */
export type InputChangeEventDetails = InputPrimitive.ChangeEventDetails
export type InputProps = InputPrimitive.Props & RefAttributes<HTMLInputElement>

/**
 * The published Input — a single-line text field, bordered and self-contained.
 *
 * Base UI's `Input` under shadcn's base-nova skin. Use it when the field is
 * just a field; reach for `InputGroup` the moment anything shares its border —
 * a leading icon, a trailing button, a keyboard hint — since that row owns the
 * border and `InputGroupInput` deliberately has none of its own.
 *
 * ```tsx
 * <Field>
 *   <FieldLabel htmlFor="title">曲目</FieldLabel>
 *   <Input id="title" name="title" />
 * </Field>
 * ```
 *
 * The label channel is the ordinary one — `FieldLabel htmlFor` → `id` on a real
 * `<input>`, no box-only detour. Base UI adds `onValueChange(value, details)`
 * beside the native `onChange`, and pairs itself with an enclosing Base UI
 * `Field.Root` by context alone; the seam's `Field` is the plain-DOM line, so
 * there the `htmlFor` is what connects them.
 *
 * The re-declaration is a cast, not a wrapper — the same one `InputGroupInput`
 * needs: the vendored file types its props as `ComponentProps<'input'>`, which
 * flattens away the two things the input underneath still honours — the
 * function form of `className`, and `onValueChange` with its details. (Not
 * `defaultValue`: Base UI redeclares that one, but to the same type the native
 * props already had.) Every prop already reaches the component through a plain
 * spread, so only the type needed restoring.
 */
export const Input = InputPrimitiveStyled as (props: InputProps) => ReactElement
