'use client'

import type { ReactElement } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@animate-ui/react/primitives/base-ui/collapsible'

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
 * the trigger is a bare `<button>` meant to be dressed with `render`. The parts
 * are animate-ui's, whose panel animates its height with Motion — the vendored
 * pass-through has none, so a panel there snaps open in a single frame.
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

/**
 * The panel. animate-ui animates its height between `0` and `auto` with Motion
 * and clips the overflow while it moves, so the seam adds no classes of its
 * own. Timing goes through its `transition` / `exitTransition` props, not
 * `className`.
 *
 * Padding belongs on an element **inside** the panel, not on the panel itself:
 * the panel's height is what animates, so its own padding gets squeezed on the
 * way through.
 *
 * A closed panel unmounts by default. `keepMounted` keeps it in the DOM, and
 * `hiddenUntilFound` goes further — `hidden="until-found"`, which lets the
 * browser's own find-in-page reach text inside a closed panel and open it.
 */
export function CollapsiblePanel(props: CollapsiblePanelProps): ReactElement {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-panel" {...props} />
}
