'use client'

import type { ComponentProps, ReactElement } from 'react'
import { Popover as PopoverPrimitive } from '@animate-ui/react/primitives/base-ui/popover'
import { cn } from '#lib/utils'

/**
 * The published Popover family — Base UI's popover in shadcn's base-nova skin.
 *
 * Renamed like `TooltipPopup`: shadcn's `PopoverContent` is Base UI's
 * `Portal → Positioner → Popup` folded into one, so here it is
 * `PopoverPopup`, taking the positioner's `side` / `sideOffset` / `align` /
 * `alignOffset`. The parts are animate-ui's (Motion runs enter and exit); the
 * vendored file is only the source of the classes.
 *
 * ```tsx
 * <Popover>
 *   <PopoverTrigger render={<Button variant="outline" />}>Open</PopoverTrigger>
 *   <PopoverPopup>
 *     <PopoverHeader>
 *       <PopoverTitle>Title</PopoverTitle>
 *       <PopoverDescription>Description</PopoverDescription>
 *     </PopoverHeader>
 *   </PopoverPopup>
 * </Popover>
 * ```
 *
 * The popup's `data-slot` stays `popover-content`: the vendored Calendar keys
 * on `in-data-[slot=popover-content]` to drop its background inside one.
 * `className` on the popup, trigger, title and description lands on Base UI
 * slots (the function form works); `PopoverHeader` is a plain `<div>`.
 */
export type PopoverProps = PopoverPrimitive.Root.Props
/** `onOpenChange`'s second argument: `reason` (`'trigger-press'`, `'outside-press'`, `'escape-key'`, …) and `cancel()`. */
export type PopoverChangeEventDetails = PopoverPrimitive.Root.ChangeEventDetails
export type PopoverTriggerProps = PopoverPrimitive.Trigger.Props
export type PopoverTriggerState = PopoverPrimitive.Trigger.State
/** Popup props plus the four positioner knobs it forwards. */
export type PopoverPopupProps = ComponentProps<typeof PopoverPrimitive.Popup>
  & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
export type PopoverPopupState = PopoverPrimitive.Popup.State
export type PopoverHeaderProps = ComponentProps<'div'>
export type PopoverTitleProps = PopoverPrimitive.Title.Props
export type PopoverDescriptionProps = PopoverPrimitive.Description.Props

export function Popover(props: PopoverProps): ReactElement {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

export function PopoverTrigger(props: PopoverTriggerProps): ReactElement {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

// The vendored popup's classes minus its tw-animate ones (`animate-*`,
// `fade-*`, `zoom-*`, `slide-in-from-*`, `duration-*`, `origin-*`) —
// animate-ui sets the transform origin and runs the animation itself.
const POPUP_CLASSNAME = `
  z-50 flex w-72 flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm
  text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden
`

/** Portal + Positioner + Popup, as the vendored `PopoverContent` was. */
export function PopoverPopup({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: PopoverPopupProps): ReactElement {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          className={cn(POPUP_CLASSNAME, className)}
          data-slot="popover-content"
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export function PopoverHeader({ className, ...props }: PopoverHeaderProps): ReactElement {
  return <div className={cn('flex flex-col gap-0.5 text-sm', className)} data-slot="popover-header" {...props} />
}

export function PopoverTitle({ className, ...props }: PopoverTitleProps): ReactElement {
  return <PopoverPrimitive.Title className={cn('font-medium', className)} data-slot="popover-title" {...props} />
}

export function PopoverDescription({ className, ...props }: PopoverDescriptionProps): ReactElement {
  return <PopoverPrimitive.Description className={cn('text-muted-foreground', className)} data-slot="popover-description" {...props} />
}
