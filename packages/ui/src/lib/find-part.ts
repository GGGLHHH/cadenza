import type { ReactNode } from 'react'
import { Children, Fragment, isValidElement } from 'react'

/**
 * Find a composed marker part in a children tree and hand back its props —
 * the `InfiniteSelectLoadingOverlay` / `DataTableLoadingOverlay` pattern: the
 * part renders null where it was written, and the owning component lifts it to
 * the position only it knows (an absolutely positioned overlay cannot render
 * meaningfully inside a flow-layout slot channel).
 *
 * Matches direct children and descends through Fragments (slot channels are
 * routinely passed as one) — a marker hidden inside a custom wrapper component
 * is invisible here, which is why every marker part documents "direct child or
 * inside a Fragment only". First match wins.
 */
export function findComposedPart<P>(
  children: ReactNode,
  part: (props: P) => ReactNode,
): P | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child))
      continue
    if (child.type === part)
      return child.props as P
    if (child.type === Fragment) {
      const found = findComposedPart((child.props as { children?: ReactNode }).children, part)
      if (found !== undefined)
        return found
    }
  }
  return undefined
}
