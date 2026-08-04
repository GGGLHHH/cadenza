import type { ReactNode } from 'react'

/**
 * Dual-form children: a plain node, or a function of the component's state
 * (which always includes `defaultChildren`).
 */
export type RenderChildren<V> = ReactNode | ((values: V & { defaultChildren: ReactNode | undefined }) => ReactNode)

/**
 * Resolve dual-form children against the state a wrapper has computed, so
 * every seam that offers them behaves identically:
 * - function children are called with `values` plus `defaultChildren`;
 * - node children are used as-is;
 * - either way a nullish result falls back to `defaultChildren` — the function
 *   branch included, so returning `null` yields the default, not a blank. The
 *   way to render nothing is to pass no `defaultChildren`.
 *
 * A plain function rather than a hook because it holds no state and calls
 * nothing of React's: both call sites (`SearchField`, `InfiniteCombobox`)
 * resolve in their own render body, where a hook would be legal — it would
 * just buy rules-of-hooks constraints for nothing.
 *
 * (Shape inherited from React Aria's `useRenderProps` children branch, which
 * the 0.2 seams were built on. The contract is this library's own now, pinned
 * by test/resolve-render-children.test.ts.)
 */
export function resolveRenderChildren<V>(
  children: RenderChildren<V>,
  values: V,
  defaultChildren?: ReactNode,
): ReactNode {
  const computed = typeof children === 'function'
    ? children({ ...values, defaultChildren })
    : children
  return computed ?? defaultChildren
}
