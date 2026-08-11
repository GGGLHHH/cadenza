'use client'

import type { ReactElement } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { cn } from '#lib/utils'

export type CollapsibleProps = CollapsiblePrimitive.Root.Props
/** The state a function `className` / `style` / `render` receives on the root. */
export type CollapsibleState = CollapsiblePrimitive.Root.State
/** `onOpenChange`'s second argument. `reason` is `trigger-press` or `none`. */
export type CollapsibleChangeEventDetails = CollapsiblePrimitive.Root.ChangeEventDetails

export type CollapsibleTriggerProps = CollapsiblePrimitive.Trigger.Props
/** The state a `CollapsibleTrigger`'s function `className` receives. */
export type CollapsibleTriggerState = CollapsiblePrimitive.Trigger.State

export type CollapsiblePanelProps = CollapsiblePrimitive.Panel.Props
/** The root's state plus `transitionStatus` (`starting` / `ending` / `idle`). */
export type CollapsiblePanelState = CollapsiblePrimitive.Panel.State

/**
 * The published Collapsible — one trigger, one panel that grows and shrinks.
 *
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger render={<Button variant="outline" />}>详情</CollapsibleTrigger>
 *   <CollapsiblePanel>
 *     <div className="p-4 text-sm">…</div>
 *   </CollapsiblePanel>
 * </Collapsible>
 * ```
 *
 * Root and trigger carry no look of their own: layout belongs to the caller and
 * the trigger is a bare `<button>` meant to be dressed with `render`. What the
 * seam adds is the panel's height transition — the vendored pass-through has
 * none, so a panel there snaps open in a single frame.
 *
 * Part names follow Base UI's vocabulary rather than shadcn's: in-flow expanding
 * content is a **Panel** (shadcn ships it as `CollapsibleContent`, a Radix-era
 * word for what Base UI itself exports as `Collapsible.Panel`).
 */
export function Collapsible(props: CollapsibleProps): ReactElement {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/**
 * The button that opens and closes the panel. A real `<button type="button">`
 * with `aria-expanded` / `aria-controls` wired by Base UI, and unstyled — so
 * `render={<Button />}` is the ordinary way to give it a look. It mirrors the
 * open state as `data-panel-open` (the panel's own attribute is `data-open`),
 * which is the hook a chevron rotates off.
 */
export function CollapsibleTrigger(props: CollapsibleTriggerProps): ReactElement {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

// Base UI's own transition recipe: it publishes the panel's measured height as
// `--collapsible-panel-height` and marks the two ends of the transition with
// `data-starting-style` / `data-ending-style`, so animating between them is
// plain CSS — no keyframes to register, unlike the accordion primitive. The
// height is the thing that animates, which is why `overflow-hidden` is here:
// without it the full-height content spills out of the shrinking box instead of
// being clipped away.
const PANEL_CLASSNAME = `
  h-(--collapsible-panel-height) overflow-hidden
  transition-[height] duration-200 ease-out
  data-ending-style:h-0
  data-starting-style:h-0
  motion-reduce:transition-none
`

/**
 * The panel. Wears the height transition by default; `className` refines it
 * (`cn` merges, yours wins) — swap `h-` for `w-(--collapsible-panel-width)` and
 * `transition-[width]` to collapse sideways instead.
 *
 * Padding belongs on an element **inside** the panel, not on the panel itself:
 * the panel's height is what animates, so its own padding gets squeezed on the
 * way through.
 *
 * A closed panel unmounts by default. `keepMounted` keeps it in the DOM, and
 * `hiddenUntilFound` goes further — `hidden="until-found"`, which lets the
 * browser's own find-in-page reach text inside a closed panel and open it.
 */
export function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps): ReactElement {
  return (
    <CollapsiblePrimitive.Panel
      className={cn(PANEL_CLASSNAME, className)}
      data-slot="collapsible-panel"
      {...props}
    />
  )
}
