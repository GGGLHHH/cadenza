import type { ComponentProps } from 'react'
import { Textarea } from '#primitives/textarea'

/**
 * The published Textarea — a multi-line text field that grows with its content
 * (`field-sizing-content`, floored at `min-h-16`).
 *
 * A plain `<textarea>` all the way down — no Base UI part, so `className` is
 * honestly a string and the props are the element's own, `ref` included.
 * That also means none of Base UI's field wiring: no `onValueChange`, no
 * `Field.Root` context pairing. The label channel is the ordinary
 * `FieldLabel htmlFor` → `id`.
 *
 * ```tsx
 * <Field>
 *   <FieldLabel htmlFor="notes">备注</FieldLabel>
 *   <Textarea id="notes" name="notes" rows={3} />
 * </Field>
 * ```
 *
 * Inside an `InputGroup` use `InputGroupTextarea` instead — the row owns the
 * border there, and this one brings its own.
 */
export type TextareaProps = ComponentProps<typeof Textarea>

export { Textarea }
