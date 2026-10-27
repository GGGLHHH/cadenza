import type { ComponentProps, ReactElement } from 'react'
import { LoaderIcon } from '@gedatou/cadenza-icons'
import { cn } from '#lib/utils'

/**
 * The published Spinner: animate-ui's animated `Loader` with `role="status"` —
 * its segments dim in turn, the same eight-spoke shape the vendored Tabler
 * `IconLoader` drew, so the vendored part's `animate-spin` is gone rather than
 * stacked on top (that would spin the fading segments).
 *
 * Plain svg underneath, no Base UI state to be a function of, so `className`
 * is a plain string (`ComponentProps<'svg'>`, ref included). Size rides the
 * baked `block-4 inline-4`; override with the same logical utilities
 * (`block-6 inline-6`, or `[1em]` values to track the ambient font), which the
 * class merge lets replace it outright.
 *
 * The `aria-label` defaults to English `'Loading'` — an aria-only fallback in
 * the house pattern ('Search', 'Rows per page'); it never renders visibly, and
 * a caller-passed `aria-label` wins since props spread after it. Purely
 * decorative placements (`Button`'s pending state does this) should pass
 * `aria-hidden` instead, so the live region does not compete with the host
 * component's own announcement.
 */
export type SpinnerProps = ComponentProps<'svg'>

export function Spinner({ className, ...props }: SpinnerProps): ReactElement {
  return (
    <LoaderIcon
      animate
      aria-label="Loading"
      className={cn('block-4 inline-4', className)}
      data-slot="spinner"
      role="status"
      // Motion's svg props differ from the DOM's only in its own event names,
      // none of which a spinner takes.
      {...(props as object)}
    />
  )
}
