import type { ComponentProps } from 'react'
import { Label } from '#primitives/label'

/**
 * The published Label — a plain `<label>` in shadcn's base-nova skin, the
 * one `FieldLabel` is built on. Inside a form field use `FieldLabel`; this is
 * for a label standing on its own, such as an `sr-only` one naming an input
 * (`<Label htmlFor="search" className="sr-only">`).
 *
 * A real `<label>` with no Base UI state underneath, so `className` is a
 * plain string.
 */
export type LabelProps = ComponentProps<typeof Label>

export { Label }
