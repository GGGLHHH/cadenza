import type { ComponentProps, ReactElement } from 'react'
import {
  Attachment,
  AttachmentAction as AttachmentActionPrimitive,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '#primitives/attachment'

/**
 * The published Attachment family — a file or image card, for message threads,
 * composers and upload lists.
 *
 * ```tsx
 * <Attachment state="uploading">
 *   <AttachmentMedia><IconFile /></AttachmentMedia>
 *   <AttachmentContent>
 *     <AttachmentTitle>programme-draft.pdf</AttachmentTitle>
 *     <AttachmentDescription>240 KB</AttachmentDescription>
 *   </AttachmentContent>
 *   <AttachmentActions>
 *     <AttachmentAction aria-label="Remove"><IconX /></AttachmentAction>
 *   </AttachmentActions>
 * </Attachment>
 * ```
 *
 * **`state` is a styling prop, not an uploader.** The five values — `idle`,
 * `uploading`, `processing`, `error`, `done` — only write `data-state` and let
 * the parts react: the border goes dashed while `idle`, destructive on `error`,
 * the title picks up the `shimmer` utility while bytes are moving, and an
 * `AttachmentMedia variant="image"` dims while `uploading`, `processing` or
 * `error` (`idle` and `done` are full opacity, and the default `icon` variant
 * never dims at all). Nothing here uploads anything, retries anything, or
 * knows what a file is; you drive the state from whatever does.
 *
 * `orientation` decides the shape: `horizontal` is a row that grows with its
 * text, `vertical` is a fixed-width tile with the actions floating over the
 * top-right corner — that is the one for an image strip under a composer.
 * `AttachmentGroup` lays those out as a snapping, horizontally scrolling row
 * with edge fades and no visible scrollbar.
 *
 * `AttachmentTrigger` is the whole-card hit area: absolutely positioned over
 * the card at `z-10`, under the actions at `z-20`, so "open the file" and
 * "remove the file" can coexist without nesting a button inside a button. It
 * takes Base UI's `render`, so it can be an `<a download>` just as easily.
 *
 * `className` is a string on every part, but only one of them had to be made
 * so. `AttachmentAction` is the *vendored* Base UI button — not this library's
 * published `Button`, so it brings none of that seam's assembly (no `pending`)
 * — and it funnels `className` through `buttonVariants` → `cva` → `clsx`, which
 * drops a function instead of resolving it. The type is narrowed here to stop
 * it promising a contract the element cannot keep; the rest land on plain DOM
 * and are honestly strings already. Style off `data-state`, `data-size` and
 * `data-orientation`.
 */

export type AttachmentProps = ComponentProps<typeof Attachment>
export type AttachmentGroupProps = ComponentProps<typeof AttachmentGroup>
export type AttachmentMediaProps = ComponentProps<typeof AttachmentMedia>
export type AttachmentContentProps = ComponentProps<typeof AttachmentContent>
export type AttachmentTitleProps = ComponentProps<typeof AttachmentTitle>
export type AttachmentDescriptionProps = ComponentProps<typeof AttachmentDescription>
export type AttachmentActionsProps = ComponentProps<typeof AttachmentActions>
/**
 * `className` narrowed to a string, like `Button`'s and `InputGroupButton`'s:
 * the route is `buttonVariants` → `cva` → `clsx`, and clsx returns `''` for a
 * function. Typing the function form while the runtime swallows it is the
 * half-open door this library refuses.
 */
export type AttachmentActionProps
  = Omit<ComponentProps<typeof AttachmentActionPrimitive>, 'className'> & { className?: string }
export type AttachmentTriggerProps = ComponentProps<typeof AttachmentTrigger>

/** Where the transfer is up to. Mirrored as `data-state`; drives every part's look. */
export type AttachmentState = NonNullable<AttachmentProps['state']>
export type AttachmentSize = NonNullable<AttachmentProps['size']>
/** `horizontal` is a text row, `vertical` a fixed-width tile. */
export type AttachmentOrientation = NonNullable<AttachmentProps['orientation']>
/** `image` fills the media box edge to edge; `icon` centres a glyph in it. */
export type AttachmentMediaVariant = NonNullable<AttachmentMediaProps['variant']>

// A cast, not a wrapper: every prop already reaches the primitive through a
// plain spread, so only the type needed narrowing (same shape as InputGroupInput).
const AttachmentAction = AttachmentActionPrimitive as (props: AttachmentActionProps) => ReactElement

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
}
