import type { ReactNode } from 'react'

/**
 * React Aria's dual-form children: a plain node, or a function of the
 * component's render props (which always include `defaultChildren`).
 */
export type RenderChildren<V> = ReactNode | ((values: V & { defaultChildren: ReactNode | undefined }) => ReactNode)

/**
 * The children branch of React Aria's `useRenderProps`, as a plain function.
 * RAC exports the real one (main entry, 1.19), but it is a hook — and the
 * main call site here resolves children *inside* a RAC function child (see
 * `SearchField`), where rules-of-hooks forbid hook calls. Same reason RAC's
 * other public helper (`composeRenderProps`) is a plain function.
 *
 * Semantics are RAC's exactly (utils.tsx, the children branch):
 * - function children are called with `values` plus `defaultChildren`;
 * - node children are used as-is;
 * - either way a nullish result falls back to `defaultChildren` — RAC's
 *   final `computedChildren ?? defaultChildren` applies to the function's
 *   return value too, so returning `null` yields the default, not a blank.
 *
 * Not for the seams where RAC itself resolves the children (Button passes
 * function children straight through), nor for collection components, whose
 * function children are an item renderer RAC caches per item — this is only
 * for the layer that owns the resolution.
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
