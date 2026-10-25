'use client'

import type { ReactElement } from 'react'
import { Tooltip as TooltipPrimitive } from '@animate-ui/react/primitives/base-ui/tooltip'
import { cn } from '#lib/utils'

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
 * The parts are animate-ui's, not the vendored ones: the vendored popup
 * animated itself with tw-animate keyframes, animate-ui's drives enter and
 * exit with Motion. Its Portal and Popup read the open state from its own
 * Root, so the whole family comes from there — the vendored file is only
 * the source of the classes below.
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
/** Popup props plus the four positioner knobs it forwards. */
export type TooltipPopupProps = TooltipPrimitive.Popup.Props
  & Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
export type TooltipPopupState = TooltipPrimitive.Popup.State

export function TooltipProvider({ delay = 0, ...props }: TooltipProviderProps): ReactElement {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />
}

export function Tooltip(props: TooltipProps): ReactElement {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

export function TooltipTrigger(props: TooltipTriggerProps): ReactElement {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

// The vendored popup's classes minus its tw-animate ones (`animate-in`,
// `fade-*`, `zoom-*`, `slide-in-from-*`, `origin-*`) — animate-ui sets the
// transform origin and runs the animation itself.
const POPUP_CLASSNAME = `
  z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground
  px-3 py-1.5 text-xs text-background
  has-data-[slot=kbd]:pr-1.5
  **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50
  **:data-[slot=kbd]:rounded-sm
`

const ARROW_CLASSNAME = `
  z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]
  bg-foreground fill-foreground
  data-[side=bottom]:top-1
  data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1
  data-[side=inline-end]:-translate-y-1/2
  data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1
  data-[side=inline-start]:-translate-y-1/2
  data-[side=left]:top-1/2! data-[side=left]:-right-1
  data-[side=left]:-translate-y-1/2
  data-[side=right]:top-1/2! data-[side=right]:-left-1
  data-[side=right]:-translate-y-1/2
  data-[side=top]:-bottom-2.5
`

/** Portal + Positioner + Popup + Arrow, as the vendored `TooltipContent` was. */
export function TooltipPopup({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  children,
  ...props
}: TooltipPopupProps): ReactElement {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(POPUP_CLASSNAME, className)}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className={ARROW_CLASSNAME} />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}
