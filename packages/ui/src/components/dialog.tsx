'use client'

import type { ComponentProps, ReactElement } from 'react'
import { AnimateIcon } from '@animate-ui/react/icons'
import { Dialog as BaseDialog } from '@animate-ui/react/primitives/base-ui/dialog'
// The handle is Base UI's own object — animate-ui re-exports it unchanged —
// and taken from there so the emitted declaration can name its type.
import { Dialog as BaseUIDialog } from '@base-ui/react/dialog'
import { XIcon } from '@gedatou/cadenza-icons'
import { cn } from '#lib/utils'
// The vendored button for the ✕: animate-ui's `Dialog.Close` is Base UI's own,
// without its press, which the published Button would add.
import { Button as ButtonPrimitive } from '#primitives/button'
import {
  DialogClose as DialogClosePrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from '#primitives/dialog'
import { ScrollFade } from './scroll-fade'

/**
 * The published Dialog family.
 *
 * The seam renames the vendored parts: shadcn ships Radix-flavoured aliases
 * (`DialogContent` / `DialogOverlay`) over what are really Base UI components,
 * and our public surface follows Base UI's own flat naming, `<Family><Part>` —
 * so the content box is `DialogPopup`, matching `Dialog.Popup`. Same rule that
 * turned `TabsTrigger` into `TabsTab`.
 *
 * Two structural additions. `DialogPopup` renders the portal, the backdrop AND
 * a `Dialog.Viewport` around itself, which the vendored `DialogContent` never
 * did — see its doc comment for why that is a fix rather than a wrapper. And
 * `DialogBody` is new here: composing one flips the popup to the other scroll
 * mode (capped height, header and footer pinned) with no prop to set.
 *
 * Composition is the whole API — there is no `title` / `description` / `actions`
 * config object, because a dialog body is arbitrary content by definition:
 *
 * ```tsx
 * <Dialog>
 *   <DialogTrigger render={<Button variant="outline" />}>打开</DialogTrigger>
 *   <DialogPopup>
 *     <DialogHeader>
 *       <DialogTitle>标题</DialogTitle>
 *       <DialogDescription>说明</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
 *       <Button>确定</Button>
 *     </DialogFooter>
 *   </DialogPopup>
 * </Dialog>
 * ```
 *
 * `DialogTitle` is not optional in practice: Base UI wires it to the popup as
 * `aria-labelledby`, and without one the dialog opens unnamed. A dialog whose
 * heading is visually redundant keeps the title and hides it with `sr-only`
 * rather than dropping it — that is what the vendored `Command` palette does.
 *
 * Base UI's own parts — `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Viewport` —
 * are deliberately not re-exported. `DialogPopup` renders all three, and
 * `backdropClassName` / `viewportClassName` reach them; a structure that needs
 * more than that is past what a seam should pretend to own, and should compose
 * `@base-ui/react/dialog` directly.
 */
export type DialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload>
/** `onOpenChange`'s second argument: `reason`, `cancel()`, `preventUnmountOnClose()`. */
export type DialogChangeEventDetails = BaseDialog.Root.ChangeEventDetails
/** What `actionsRef` exposes: `close()` and `unmount()`. */
export type DialogActions = BaseDialog.Root.Actions

/**
 * The root. Owns the open state and nothing visual — it renders no element.
 *
 * The controlled triple is `open` / `defaultOpen` / `onOpenChange`, and the
 * callback's second argument is a real `ChangeEventDetails`: `reason` tells you
 * WHY it closed (`'trigger-press'`, `'outside-press'`, `'escape-key'`,
 * `'close-press'`, `'focus-out'`, `'imperative-action'`, `'none'`) and
 * `cancel()` is honoured — call it and the dialog stays open. That is the hook
 * for "confirm before discarding": not `disablePointerDismissal` plus a
 * hand-rolled guard, one `cancel()` on the reasons you want to refuse.
 *
 * `modal` is `true` by default (focus trapped, page scroll locked, outside
 * pointer events dead). `'trap-focus'` keeps the trap but releases the scroll
 * lock and outside pointers — the setting for a dialog that coexists with the
 * page. `false` drops the trap too.
 *
 * Renders Base UI's Root directly, NOT the vendored wrapper — the vendored one
 * types its props as the non-generic `Dialog.Root.Props`, which flattens
 * `handle`'s payload to `unknown` and takes the render-function `children` with
 * it. There is nothing else in that wrapper: the root renders no element, so
 * its `data-slot` lands nowhere.
 */
export function Dialog<Payload>(props: DialogProps<Payload>): ReactElement {
  return <BaseDialog.Root {...props} />
}

export type DialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload>

/**
 * Opens the dialog. Renders a plain `<button>`; pass `render={<Button />}` to
 * borrow the library's button instead of nesting one inside another.
 *
 * Base UI keeps the trigger and the popup wired both ways — `aria-haspopup`,
 * `aria-controls`, and focus returning here on close — so a trigger is worth
 * using even when you also control `open` yourself.
 *
 * Generic for the same reason the root is: `payload` is typed by the `handle`
 * it is paired with, and the vendored wrapper erased that.
 */
export function DialogTrigger<Payload>(props: DialogTriggerProps<Payload>): ReactElement {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />
}

export type DialogPopupProps = BaseDialog.Popup.Props & {
  /** The `×` in the top corner. */
  showCloseButton?: boolean
  /** Class names for the backdrop layer this popup renders behind itself. */
  backdropClassName?: BaseDialog.Backdrop.Props['className']
  /**
   * Class names for the scroll viewport. Override the padding here — it is the
   * gap between the popup and the screen edge — or swap the centring.
   */
  viewportClassName?: BaseDialog.Viewport.Props['className']
}

export type DialogPopupState = BaseDialog.Popup.State

// The scroll container, and the reason this seam has a Viewport at all.
//
// The vendored popup pinned itself with `fixed top-1/2 left-1/2 -translate-1/2`.
// That centres beautifully until the content is taller than the screen, at
// which point it overflows off BOTH edges and nothing scrolls — the popup is
// fixed, so the page cannot scroll it, and it is its own overflow root, so it
// cannot scroll itself. Base UI ships `Dialog.Viewport` for exactly this; the
// vendored source predates it.
//
// `m-auto` on the popup rather than `items-center` here: a flex item that is
// taller than its overflow container gets its leading edge clipped under
// `align-items: center` (the item is centred, so the overflow is split above
// and below, and the part above scroll origin is unreachable). Auto margins
// distribute leftover space the same way but collapse to zero when there is
// none, so an oversized popup falls back to flush-start and stays scrollable.
const VIEWPORT_CLASSNAME = `
  fixed inset-0 z-50 flex overflow-y-auto p-4
`

// The vendored backdrop's classes, inlined rather than imported: the vendored
// component stamps `data-slot="dialog-overlay"`, and a public part named
// Backdrop that answers to `[data-slot=dialog-overlay]` is exactly the
// shadcn-history leak this seam exists to absorb. No animation classes here or
// on the popup: both parts are animate-ui's, which fade and flip them in and
// out with Motion and hold the unmount until the exit has played.
const BACKDROP_CLASSNAME = `
  fixed inset-0 isolate z-50 bg-black/10
  supports-backdrop-filter:backdrop-blur-xs
`

// The `:has()` rules are the whole configuration story for inside-scrolling:
// composing a `DialogBody` switches the popup from "grow as tall as the content
// needs" to "cap at the screen and let the body scroll". No prop, no mode, and
// the two behaviours cannot contradict each other — once the popup is capped
// there is nothing for the viewport's own scroll to do, so it steps aside.
//
// Flex rather than grid for that layout: `flex-1` + `min-block-0` on the body
// fills the leftover space and stays shrinkable regardless of how many siblings
// there are, whereas a grid would need `grid-template-rows` written out and
// would break the moment a header or footer is left off.
const POPUP_CLASSNAME = `
  relative m-auto grid gap-4 rounded-xl bg-popover p-4 text-sm
  text-popover-foreground ring-1 ring-foreground/10 outline-none
  inline-full
  has-[>[data-slot=dialog-body]]:flex has-[>[data-slot=dialog-body]]:max-block-full
  has-[>[data-slot=dialog-body]]:flex-col
  sm:max-inline-sm
`

/**
 * The dialog box. Renders four Base UI parts, not one:
 *
 * ```text
 * Dialog.Portal        ← escapes the trigger's stacking / overflow context
 * ├── Dialog.Backdrop  ← the dimmed, blurred page behind (backdropClassName)
 * └── Dialog.Viewport  ← fixed, full-screen, SCROLLS (viewportClassName)
 *     └── Dialog.Popup ← this component's own className
 * ```
 *
 * The viewport is the fix: without it a popup taller than the screen overflows
 * off both edges with no way to scroll. With it, long content scrolls the whole
 * dialog — header and footer included — against the backdrop. For the other
 * flavour, where the header and footer stay put and only the middle scrolls,
 * compose a `DialogBody`; the popup then caps at the screen height, so this
 * viewport has nothing left to scroll and stays out of the way.
 *
 * `initialFocus` / `finalFocus` are Base UI's and pass straight through — a
 * `RefObject` to aim focus at a specific element on open or close, `false` to
 * leave focus alone. Default: the first tabbable element inside, except when
 * opened by touch (then the popup itself, so the virtual keyboard stays down).
 *
 * The close button is a real `DialogClose`, and under `modal` it is load-bearing
 * rather than decorative — a touch screen reader has no Escape key, so removing
 * it with `showCloseButton={false}` means providing another way out inside the
 * content.
 */
export function DialogPopup({
  className,
  children,
  showCloseButton = true,
  backdropClassName,
  viewportClassName,
  ...props
}: DialogPopupProps): ReactElement {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="dialog-backdrop"
        className={cn(BACKDROP_CLASSNAME, backdropClassName)}
      />
      <BaseDialog.Viewport
        data-slot="dialog-viewport"
        className={cn(VIEWPORT_CLASSNAME, viewportClassName)}
      >
        <BaseDialog.Popup
          data-slot="dialog-popup"
          className={cn(POPUP_CLASSNAME, className)}
          {...props}
        >
          {children}
          {showCloseButton && (
            <AnimateIcon animateOnHover asChild>
              <BaseDialog.Close
                data-slot="dialog-close"
                render={(
                  <ButtonPrimitive
                    variant="ghost"
                    size="icon-sm"
                    className="absolute inset-e-2 inset-bs-2"
                  />
                )}
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </BaseDialog.Close>
            </AnimateIcon>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  )
}

export type DialogHeaderProps = ComponentProps<typeof DialogHeaderPrimitive>

/** Stacks the title and description. A plain `<div>`, not a Base UI part. */
export const DialogHeader = DialogHeaderPrimitive

export type DialogBodyProps = ComponentProps<'div'>

/**
 * The scrolling middle. Composing one flips the popup into the other scroll
 * mode: instead of the whole dialog growing past the screen and the viewport
 * scrolling it (see `DialogPopup`), the popup caps at the screen height and
 * only this section moves — header and footer stay put, so the actions are
 * always reachable.
 *
 * ```tsx
 * <DialogPopup>
 *   <DialogHeader>…</DialogHeader>
 *   <DialogBody>…</DialogBody>
 *   <DialogFooter>…</DialogFooter>
 * </DialogPopup>
 * ```
 *
 * Nothing to switch on: the popup keys off this element's presence with a
 * `:has()` rule. Cap somewhere other than the screen by overriding the popup's
 * `max-block-full` (`className="max-block-[32rem]"`).
 *
 * A plain scrolling `<div>`, deliberately NOT the library's `ScrollArea`. That
 * component scrolls a viewport nested inside it which sizes itself with
 * `block-full`, and a percentage needs a containing block whose `height` is
 * definite. Here the height is a flex **main** size: the flex algorithm decides
 * it during layout while the `height` property stays `auto`, so the percentage
 * never resolves, the viewport falls back to content height, and nothing is
 * ever clipped. Wrapping it in an absolutely-positioned box does not rescue it
 * either — Base UI stamps `position: relative` inline on the scroll area root,
 * which no class can outrank. Putting `overflow` straight on the flex item
 * sidesteps percentage resolution altogether.
 *
 * The trade is the scrollbar: `ScrollArea` exists so the scroll fade's mask
 * cannot dim it (its bar is a sibling of the scrolling element, not inside it).
 * Here the native bar does sit inside the mask. The fade (a `ScrollFade`, which
 * also sets that `overflow`) still earns its place — a line cut mid-height at
 * the edge is the only cue that there is more content, and on macOS the overlay
 * bar is invisible until you actually move.
 *
 * `-mx-4 px-4` cancels the popup's own padding and puts the same amount back as
 * the section's, which widens the scroll box to the popup's full width without
 * moving a single character. The scrollbar then rides the popup's edge instead
 * of floating in the gutter, the way a panel's scrollbar should. Same trick
 * `DialogFooter` uses to run its muted strip edge to edge, and it assumes the
 * popup's `p-4` — change one, change both.
 */
export function DialogBody({ className, ...props }: DialogBodyProps): ReactElement {
  return (
    <ScrollFade
      data-slot="dialog-body"
      className={cn(`-mx-4 flex-1 px-4 min-block-0`, className)}
      {...props}
    />
  )
}

export type DialogTitleProps = ComponentProps<typeof DialogTitlePrimitive>

/** Names the dialog: Base UI points the popup's `aria-labelledby` at it. */
export const DialogTitle = DialogTitlePrimitive

export type DialogDescriptionProps = ComponentProps<typeof DialogDescriptionPrimitive>

/** Describes the dialog: wired up as the popup's `aria-describedby`. */
export const DialogDescription = DialogDescriptionPrimitive

export type DialogFooterProps = Omit<
  ComponentProps<typeof DialogFooterPrimitive>,
  'showCloseButton'
>

/**
 * The action bar. Cancels the popup's padding so the muted strip runs edge to
 * edge, and reverses on mobile so the primary action sits on top.
 *
 * The vendored footer's `showCloseButton` is dropped: it rendered a button
 * labelled with a hardcoded English "Close", and a dismiss action's wording
 * belongs to the caller. Write it — one line, and the label is yours:
 * `<DialogClose render={<Button variant="outline" />}>取消</DialogClose>`.
 */
export function DialogFooter(props: DialogFooterProps): ReactElement {
  return <DialogFooterPrimitive {...props} />
}

export type DialogCloseProps = ComponentProps<typeof DialogClosePrimitive>

/**
 * Closes the dialog. Renders a plain `<button>`; `render={<Button />}` styles it.
 * The resulting `onOpenChange` carries `reason: 'close-press'`.
 */
export const DialogClose = DialogClosePrimitive

/**
 * Creates a handle that opens a dialog from outside its tree — pass it to both
 * `Dialog` and any number of `DialogTrigger`s, and they find each other without
 * shared state.
 *
 * This is re-exported because it cannot be reached otherwise: `@base-ui/react`
 * is our dependency, not the consumer's, so `Dialog.createHandle` is not
 * importable from an app.
 *
 * The handle is generic over a payload. A trigger passes one, and the root's
 * children can be a function receiving it — which is how one dialog serves a
 * list of rows without lifting a `selectedRow` into state.
 */
export const createDialogHandle = BaseUIDialog.createHandle
export type DialogHandle<Payload = unknown> = BaseUIDialog.Handle<Payload>
