import type { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import type { ComponentProps } from 'react'
import { Separator } from '#primitives/separator'

/**
 * The published Separator — Base UI's separator in shadcn's base-nova skin,
 * a 1px rule. `orientation` (default `'horizontal'`) writes
 * `data-horizontal` / `data-vertical`, which size it; a vertical one
 * stretches to its flex row (`self-stretch`), so give the row a height or
 * set one with `className`.
 *
 * `className` lands on Base UI's slot, so the function form works too.
 */
export type SeparatorProps = ComponentProps<typeof Separator>
export type SeparatorState = SeparatorPrimitive.State

export { Separator }
