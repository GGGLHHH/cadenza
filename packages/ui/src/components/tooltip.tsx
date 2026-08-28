'use client'

import type { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import type { ComponentProps, ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#primitives/tooltip'

/**
 * The published Tooltip family — Base UI's tooltip in shadcn's base-nova skin.
 *
 * The seam renames one part: shadcn ships `TooltipContent`, which is really
 * Base UI's `Portal → Positioner → Popup` (plus the arrow) folded into one
 * component. Our public surface follows Base UI's flat naming, so it is
 * `TooltipPopup` — the same rule that turned `DialogContent` into
 * `DialogPopup`. The positioner knobs it accepts (`side`, `sideOffset`,
 * `align`, `alignOffset`) stay on the popup; a placement that needs more
 * than those composes `@base-ui/react/tooltip` directly.
 *
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger render={<Button variant="outline" />}>Hover</TooltipTrigger>
 *   <TooltipPopup>Add to library</TooltipPopup>
 * </Tooltip>
 * ```
 *
 * One thing the rename does NOT change: the popup's `data-slot` is still
 * `tooltip-content`. `Kbd`'s vendored styles key on
 * `in-data-[slot=tooltip-content]` to invert their colours inside a tooltip,
 * and the primitives are byte-pinned — so the slot name is a contract we keep.
 *
 * `TooltipProvider` is optional: it shares one open delay across a group of
 * tooltips (the vendored default is `delay={0}`, so grouped tooltips open
 * instantly). Without it every trigger times itself — Base UI's own default
 * is 600 ms, and a trigger's own `delay` wins over the provider either way.
 *
 * `className` on the popup lands on Base UI's Popup slot, so the function
 * form `({ open }) => …` works; the trigger likewise. Style off `data-open`
 * / `data-side` (`'top' | 'bottom' | 'inline-start' | 'inline-end'` …) —
 * hover and focus are CSS pseudo-classes, not data attributes.
 */
export type TooltipProps = TooltipPrimitive.Root.Props
/** `onOpenChange`'s second argument: `reason` (`'trigger-hover'`, `'trigger-focus'`, `'escape-key'`, …) and `cancel()`. */
export type TooltipChangeEventDetails = TooltipPrimitive.Root.ChangeEventDetails
export type TooltipProviderProps = TooltipPrimitive.Provider.Props
export type TooltipTriggerProps = TooltipPrimitive.Trigger.Props
export type TooltipTriggerState = TooltipPrimitive.Trigger.State
/** Popup props plus the four positioner knobs the vendored part forwards. */
export type TooltipPopupProps = ComponentProps<typeof TooltipContent>
export type TooltipPopupState = TooltipPrimitive.Popup.State

/** A cast, not a wrapper: every prop reaches the vendored part by spread; only the name changes. */
export const TooltipPopup = TooltipContent as (props: TooltipPopupProps) => ReactElement

export { Tooltip, TooltipProvider, TooltipTrigger }
