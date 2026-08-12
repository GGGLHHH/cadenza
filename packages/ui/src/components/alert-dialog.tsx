'use client'

import type { ComponentProps, ReactElement } from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { applyPointerFlip, clearPointerOrigin, recordPointerOrigin } from '#lib/pointer-origin'
import { cn } from '#lib/utils'
import {
  AlertDialogDescription as AlertDialogDescriptionPrimitive,
  AlertDialogFooter as AlertDialogFooterPrimitive,
  AlertDialogHeader as AlertDialogHeaderPrimitive,
  AlertDialogMedia as AlertDialogMediaPrimitive,
  AlertDialogTitle as AlertDialogTitlePrimitive,
} from '#primitives/alert-dialog'

/**
 * The published AlertDialog family — a dialog that refuses to go away until the
 * user answers it.
 *
 * Built on Base UI's **Dialog** root, not its AlertDialog root, and that is a
 * deliberate departure worth explaining.
 *
 * Base UI's AlertDialog is Dialog underneath already — `AlertDialogRoot` is
 * `useRenderDialogRoot('alert-dialog', props)`, and the Popup, Backdrop,
 * Viewport, Title, Description and Close are re-exported from Dialog verbatim.
 * The only thing that mode changes is two lines:
 *
 * ```js
 * const disablePointerDismissal = isAlertDialog || disablePointerDismissalProp
 * const role = isAlertDialog ? 'alertdialog' : 'dialog'
 * ```
 *
 * The first is hard-coded — no prop reaches it, which is why the type omits
 * `disablePointerDismissal` entirely. That makes an outside press impossible to
 * re-enable, and this library wants it enabled by default. So the seam takes
 * Dialog's root and puts the second line back by hand: `AlertDialogPopup`
 * passes `role="alertdialog"`, which wins because Base UI merges caller props
 * last. The accessibility semantics survive; only the locked-shut behaviour is
 * traded away.
 *
 * The consequence: this dialog **closes on an outside press by default**, and
 * `modal` / `disablePointerDismissal` are both available again. A confirmation
 * that genuinely must not be dismissed by accident asks for it:
 *
 * ```tsx
 * <AlertDialog disablePointerDismissal>
 * ```
 *
 * The seam follows [[Dialog]] on every shared question — Base UI's flat part
 * names (`AlertDialogContent` → `AlertDialogPopup`, `AlertDialogOverlay` →
 * `AlertDialogBackdrop`), a `Dialog.Viewport` so long content can scroll, and
 * an entrance that grows out of the pointer.
 *
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger render={<Button variant="destructive" />}>删除</AlertDialogTrigger>
 *   <AlertDialogPopup>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>删除这份草稿？</AlertDialogTitle>
 *       <AlertDialogDescription>删除后无法恢复。</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogClose render={<Button variant="outline" />}>取消</AlertDialogClose>
 *       <AlertDialogClose render={<Button variant="destructive" />} onClick={remove}>
 *         删除
 *       </AlertDialogClose>
 *     </AlertDialogFooter>
 *   </AlertDialogPopup>
 * </AlertDialog>
 * ```
 *
 * Both footer buttons are `AlertDialogClose`; the destructive one carries the
 * work in `onClick`. shadcn ships `AlertDialogAction` / `AlertDialogCancel` for
 * this pair and neither is promoted: `Action` was a bare `Button` with a
 * `data-slot`, and `Cancel` was `Close` plus `variant="outline"` — a line the
 * caller writes anyway, and writing it keeps the wording and the variant where
 * they belong.
 */
export type AlertDialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload>
/** `onOpenChange`'s second argument: `reason`, `cancel()`, `preventUnmountOnClose()`. */
export type AlertDialogChangeEventDetails = BaseDialog.Root.ChangeEventDetails
/** What `actionsRef` exposes: `close()` and `unmount()`. */
export type AlertDialogActions = BaseDialog.Root.Actions

/**
 * The root. Owns the open state and renders no element.
 *
 * `open` / `defaultOpen` / `onOpenChange` as usual, and the callback's second
 * argument is a real `ChangeEventDetails` whose `cancel()` is honoured. The
 * full Dialog prop set applies, including `modal` and `disablePointerDismissal`
 * — see this file's doc comment for why those are available here at all.
 *
 * Every `reason` Dialog can produce arrives here too, `'outside-press'`
 * included. Which is the thing to remember when wiring destructive work: put it
 * on a button's `onClick`, never on `onOpenChange`, or a stray click on the
 * backdrop will trigger it.
 */
export function AlertDialog<Payload>(props: AlertDialogProps<Payload>): ReactElement {
  return <BaseDialog.Root {...props} />
}

export type AlertDialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload>

/**
 * Opens it. Renders a plain `<button>`; `render={<Button />}` styles it.
 *
 * The seam's addition is the same bookkeeping [[DialogTrigger]] does — record
 * where the pointer was, so the popup can grow out of that point.
 */
export function AlertDialogTrigger<Payload>({
  onKeyDown,
  onPointerDown,
  ...props
}: AlertDialogTriggerProps<Payload>): ReactElement {
  return (
    <BaseDialog.Trigger
      data-slot="alert-dialog-trigger"
      onPointerDown={(event) => {
        recordPointerOrigin(event)
        onPointerDown?.(event)
      }}
      onKeyDown={(event) => {
        clearPointerOrigin()
        onKeyDown?.(event)
      }}
      {...props}
    />
  )
}

/** `default` is the everyday box; `sm` is narrower and stacks its actions 50/50. */
export type AlertDialogSize = 'default' | 'sm'

export type AlertDialogPopupProps = BaseDialog.Popup.Props & {
  size?: AlertDialogSize
  /** Class names for the backdrop layer this popup renders behind itself. */
  backdropClassName?: BaseDialog.Backdrop.Props['className']
  /**
   * Class names for the scroll viewport. Override the padding here — it is the
   * gap between the popup and the screen edge — or swap the centring.
   */
  viewportClassName?: BaseDialog.Viewport.Props['className']
}

export type AlertDialogPopupState = BaseDialog.Popup.State

// Kept byte-for-byte in step with Dialog's backdrop and viewport. They are not
// shared through a module because `#lib/*` resolves to `.ts` only, and the
// Tailwind lint rules (canonical classes, class order, logical properties —
// eight of them, all errors) are scoped to `**/*.tsx`. A shared constant would
// leave both copies unchecked; two checked copies is the better trade.
const BACKDROP_CLASSNAME = `
  fixed inset-0 isolate z-50 bg-black/10 transition-opacity duration-250
  supports-backdrop-filter:backdrop-blur-xs
  data-ending-style:opacity-0
  data-starting-style:opacity-0
`

const VIEWPORT_CLASSNAME = `
  fixed inset-0 z-50 flex overflow-y-auto p-4
`

// `group/alert-dialog-content` is load-bearing and deliberately NOT renamed to
// match the part: the vendored Header, Footer, Title and Media all style
// themselves off `group-data-[size=…]/alert-dialog-content:` selectors, and
// those carry the whole responsive alignment story (centred on mobile,
// left-aligned from `sm` at the default size, media in its own grid column).
// Renaming the group to match `data-slot="alert-dialog-popup"` would silently
// flatten all four. The group name is a vendored internal, not public API.
//
// Positioning, animation and the FLIP anchor are Dialog's — see that file for
// why the popup no longer pins itself with a fixed translate, and why the
// entrance is a transition rather than keyframes.
const POPUP_CLASSNAME = `
  group/alert-dialog-content relative m-auto grid origin-center gap-4
  rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10
  outline-none
  inline-full
  transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]
  data-[size=default]:max-inline-xs data-[size=sm]:max-inline-xs
  data-[size=default]:sm:max-inline-sm
  data-ending-style:transform-(--dialog-flip) data-ending-style:opacity-0
  data-starting-style:transform-(--dialog-flip) data-starting-style:opacity-0
  motion-reduce:data-ending-style:transform-none
  motion-reduce:data-starting-style:transform-none
`

/**
 * The box. Renders four Base UI parts, exactly as `DialogPopup` does:
 *
 * ```text
 * AlertDialog.Portal
 * ├── AlertDialog.Backdrop  ← the dimmed, blurred page behind (backdropClassName)
 * └── AlertDialog.Viewport  ← fixed, full-screen, SCROLLS (viewportClassName)
 *     └── AlertDialog.Popup ← this component's own className
 * ```
 *
 * No `showCloseButton`, and that is the point rather than an omission. A `×` in
 * the corner is a way out that answers nothing, which is what an alert dialog
 * exists to prevent — the vendored source has none either. Give every exit a
 * label in the footer.
 *
 * `size="sm"` narrows the box and turns the footer into two equal columns, for
 * the "this or that" case where neither action is the obvious default.
 */
export function AlertDialogPopup({
  className,
  size = 'default',
  backdropClassName,
  viewportClassName,
  ...props
}: AlertDialogPopupProps): ReactElement {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="alert-dialog-backdrop"
        className={cn(BACKDROP_CLASSNAME, backdropClassName)}
      />
      <BaseDialog.Viewport
        data-slot="alert-dialog-viewport"
        ref={applyPointerFlip}
        className={cn(VIEWPORT_CLASSNAME, viewportClassName)}
      >
        <BaseDialog.Popup
          // Base UI's own AlertDialog would set this, but its Root hard-codes
          // `disablePointerDismissal = true` — see this file's doc comment for
          // why that made it unusable here. Base UI merges caller props last,
          // so passing `role` overrides the `'dialog'` its store would apply,
          // and the accessibility semantics survive the swap.
          role="alertdialog"
          data-slot="alert-dialog-popup"
          data-size={size}
          className={cn(POPUP_CLASSNAME, className)}
          {...props}
        />
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  )
}

export type AlertDialogHeaderProps = ComponentProps<typeof AlertDialogHeaderPrimitive>

/**
 * Stacks the media, title and description. A plain `<div>`, not a Base UI part.
 * It reads the popup's `size` off the group to decide alignment: centred
 * everywhere at `sm`, left-aligned from the `sm` breakpoint at `default`.
 */
export const AlertDialogHeader = AlertDialogHeaderPrimitive

export type AlertDialogMediaProps = ComponentProps<typeof AlertDialogMediaPrimitive>

/**
 * The icon tile above (or beside) the title — a muted rounded square that sizes
 * any bare `svg` child to `size-6`. Its presence re-shapes the header's grid,
 * which is why it is a part rather than something you nest by hand.
 */
export const AlertDialogMedia = AlertDialogMediaPrimitive

export type AlertDialogTitleProps = ComponentProps<typeof AlertDialogTitlePrimitive>

/** Names the dialog: Base UI points the popup's `aria-labelledby` at it. */
export const AlertDialogTitle = AlertDialogTitlePrimitive

export type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogDescriptionPrimitive>

/** Describes the consequence: wired up as the popup's `aria-describedby`. */
export const AlertDialogDescription = AlertDialogDescriptionPrimitive

export type AlertDialogFooterProps = ComponentProps<typeof AlertDialogFooterPrimitive>

/**
 * The action bar. Cancels the popup's padding so the muted strip runs edge to
 * edge, reverses on mobile so the primary action sits on top, and at
 * `size="sm"` lays the actions out as two equal columns instead.
 */
export const AlertDialogFooter = AlertDialogFooterPrimitive

export type AlertDialogCloseProps = BaseDialog.Close.Props

/**
 * Closes it. Every exit is one of these — including the one that does the work,
 * which carries it in `onClick`:
 *
 * ```tsx
 * <AlertDialogClose render={<Button variant="destructive" />} onClick={remove}>
 *   删除
 * </AlertDialogClose>
 * ```
 *
 * The resulting `onOpenChange` carries `reason: 'close-press'`, so a guard on
 * the root can still tell a deliberate answer from an Escape.
 */
export function AlertDialogClose(props: AlertDialogCloseProps): ReactElement {
  return <BaseDialog.Close data-slot="alert-dialog-close" {...props} />
}

/**
 * Creates a handle that opens an alert dialog from outside its tree — pass it
 * to both `AlertDialog` and any number of `AlertDialogTrigger`s.
 *
 * Re-exported because it cannot be reached otherwise: `@base-ui/react` is our
 * dependency, not the consumer's. Generic over a payload, which the root's
 * function-children receive as `{ payload }` — one confirmation dialog can
 * serve a whole list of rows without lifting the pending row into state.
 */
export const createAlertDialogHandle = BaseDialog.createHandle
export type AlertDialogHandle<Payload = unknown> = BaseDialog.Handle<Payload>
