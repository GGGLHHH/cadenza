import type { ComponentProps } from 'react'
import { Spinner } from '#primitives/spinner'

/**
 * The published Spinner: a spinning `IconLoader` with `role="status"`.
 *
 * Plain svg underneath — no RAC base — so `className` is a string
 * (`ComponentProps<'svg'>`, ref included). Size rides the baked `size-4`;
 * override with the logical utilities (`block-6 inline-6`, or `[1em]` values
 * to track the ambient font) — they sort after the physical ones in the built
 * stylesheet, which is what makes the override stick at equal specificity.
 *
 * The vendored `aria-label` defaults to English `'Loading'` — an aria-only
 * fallback in the house pattern ('Search', 'Rows per page'); it never renders
 * visibly, and a caller-passed `aria-label` wins since the primitive spreads
 * props after it. Purely decorative placements (`Button`'s pending state does
 * this) should pass `aria-hidden` instead, so the live region does not compete
 * with the host component's own announcement.
 */
export type SpinnerProps = ComponentProps<typeof Spinner>

export { Spinner }
