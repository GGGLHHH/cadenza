'use client'

import type { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import type { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import type { VariantProps } from 'class-variance-authority'
import type { CSSProperties, ReactElement } from 'react'
import { Toggle as TogglePrimitiveRoot } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitiveRoot } from '@base-ui/react/toggle-group'
import { createContext, use, useMemo } from 'react'
import { cn } from '#lib/utils'
import { toggleVariants } from '#primitives/toggle'

type ToggleVariants = VariantProps<typeof toggleVariants>

export type ToggleGroupState = ToggleGroupPrimitive.State
/** `onValueChange`'s second argument. */
export type ToggleGroupChangeEventDetails = ToggleGroupPrimitive.ChangeEventDetails

// Both parts keep Base UI's `className` type, function form included. Unlike
// `Toggle` — which hands the caller's className to `cva`, where clsx drops a
// function — this file calls `cva` for the variant classes only and merges the
// caller's through `cn`, which resolves a function against the state. Narrowing
// here would be the half-open door in reverse: the route works, the type just
// would not say so.
export type ToggleGroupProps<Value extends string = string>
  = ToggleGroupPrimitive.Props<Value>
    & ToggleVariants
    & {
    /** Gap between items, in spacing units. `0` fuses them into one segmented bar. */
      spacing?: number
    }

export type ToggleGroupItemProps<Value extends string = string>
  = TogglePrimitive.Props<Value> & ToggleVariants
/** The state a `ToggleGroupItem`'s function `className` receives. */
export type ToggleGroupItemState = TogglePrimitive.State

const ToggleGroupContext = createContext<ToggleVariants & { spacing?: number }>({
  size: 'default',
  spacing: 2,
  variant: 'default',
})
if (process.env.NODE_ENV !== 'production')
  ToggleGroupContext.displayName = 'ToggleGroupContext'

/**
 * The published ToggleGroup — related toggles that share a value.
 *
 * ```tsx
 * <ToggleGroup aria-label="对齐" defaultValue={['start']}>
 *   <ToggleGroupItem value="start" aria-label="左对齐"><IconAlignLeft /></ToggleGroupItem>
 *   <ToggleGroupItem value="center" aria-label="居中"><IconAlignCenter /></ToggleGroupItem>
 * </ToggleGroup>
 * ```
 *
 * `value` is always an **array**, even single-select: `multiple` (default
 * `false`) decides whether more than one entry can be in it at a time.
 *
 * This is the seam's own composition rather than a re-export. The vendored one
 * declares an `orientation` prop of its own, uses it for `data-orientation` and
 * the flex direction — and then never passes it on, so Base UI's composite kept
 * navigating horizontally: a group that *looked* vertical still moved on
 * ← / → and ignored ↑ / ↓. Here `orientation` goes to Base UI, which writes
 * `data-orientation` off its own state; the layout reads that same attribute,
 * so the visual and the keyboard can no longer disagree.
 *
 * - **`variant`** / **`size`** are shadcn's cva knobs, set once on the group and
 *   handed to the items through context; an item can still override its own.
 * - **`spacing`** is the gap in spacing units. `0` fuses the items into one
 *   segmented bar (shared corners, collapsed borders).
 * - **`multiple`**, **`disabled`**, **`loopFocus`** and the controlled triple
 *   are Base UI's, passed straight through.
 */
export function ToggleGroup<Value extends string = string>({
  children,
  className,
  orientation = 'horizontal',
  size,
  spacing = 2,
  style,
  variant,
  ...props
}: ToggleGroupProps<Value>): ReactElement {
  // `--gap` is internal wiring, not a default: left before the spread it would
  // be replaced wholesale by any caller `style`, taking `spacing` down with it
  // (the gap collapses while `data-spacing` still claims the old value). Merged
  // here instead — and through the function form too, which Base UI allows.
  const withGap = (base: CSSProperties | undefined): CSSProperties =>
    ({ '--gap': spacing, ...base } as CSSProperties)
  const mergedStyle = typeof style === 'function'
    ? (state: ToggleGroupState) => withGap(style(state))
    : withGap(style)
  // §6: context value is memoised before it reaches the Provider — three scalar
  // props, so there is nothing here that earns the "changes key by key" exemption.
  const contextValue = useMemo(() => ({ size, spacing, variant }), [size, spacing, variant])

  return (
    <ToggleGroupPrimitiveRoot
      className={cn(
        `
          group/toggle-group flex flex-row items-center
          gap-[--spacing(var(--gap))] rounded-lg inline-fit
          data-[size=sm]:rounded-[min(var(--radius-md),10px)]
          data-vertical:flex-col data-vertical:items-stretch
        `,
        className,
      )}
      data-size={size}
      data-slot="toggle-group"
      data-spacing={spacing}
      data-variant={variant}
      orientation={orientation}
      style={mergedStyle}
      {...props}
    >
      <ToggleGroupContext value={contextValue}>
        {children}
      </ToggleGroupContext>
    </ToggleGroupPrimitiveRoot>
  )
}

/**
 * One toggle in a `ToggleGroup`. `value` is what lands in the group's value
 * array. `variant` / `size` inherit from the group unless set here.
 *
 * "Unless set here" is the seam's doing: the vendored item read
 * `context.variant || variant`, so a group that set the knob won and an item
 * could never override it — the item's own default (`'default'`) is why it had
 * to, since a plain `??` on a defaulted prop would have let the default shout
 * down the group. Leaving the item's props undefined until they are resolved
 * gives the ordinary precedence instead: item, then group, then the library's.
 */
export function ToggleGroupItem<Value extends string = string>({
  children,
  className,
  size,
  variant,
  ...props
}: ToggleGroupItemProps<Value>): ReactElement {
  const group = use(ToggleGroupContext)
  const resolvedSize = size ?? group.size ?? 'default'
  const resolvedVariant = variant ?? group.variant ?? 'default'

  return (
    <TogglePrimitiveRoot
      className={cn(
        `
          shrink-0
          group-data-[spacing=0]/toggle-group:rounded-none
          group-data-[spacing=0]/toggle-group:px-2
          focus:z-10
          focus-visible:z-10
          group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pe-1.5
          group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:ps-1.5
          group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-s-lg
          group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg
          group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-e-lg
          group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg
          group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-s-0
          group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-bs-0
          group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-s
          group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-bs
        `,
        toggleVariants({ size: resolvedSize, variant: resolvedVariant }),
        className,
      )}
      data-size={resolvedSize}
      data-slot="toggle-group-item"
      data-spacing={group.spacing}
      data-variant={resolvedVariant}
      {...props}
    >
      {children}
    </TogglePrimitiveRoot>
  )
}
