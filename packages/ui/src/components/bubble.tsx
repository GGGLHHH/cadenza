import type { ComponentProps } from 'react'
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '#primitives/bubble'

/**
 * The published Bubble family — the visible surface of a message.
 *
 * `Message` owns the row (avatar, alignment, header, footer); `Bubble` is what
 * the reader actually sees inside it. The split matters because an assistant
 * turn usually wants no surface at all — `variant="ghost"` strips the
 * background and the padding, leaving plain text that can run the full width,
 * while a user turn keeps a tinted, rounded box hugging its content.
 *
 * ```tsx
 * <Bubble variant="muted">
 *   <BubbleContent>Where does the interval go?</BubbleContent>
 * </Bubble>
 * ```
 *
 * The *surface* — colour, padding, radius — is applied to the content, not to
 * `Bubble` itself: each variant is a set of `*:data-[slot=bubble-content]`
 * rules, so the colour lands on `BubbleContent` and a bubble with no content
 * part renders nothing visible. That indirection is what lets
 * `BubbleReactions` float over the surface without inheriting it.
 *
 * A variant can still reach the root for things that are about the *box* rather
 * than the surface — `ghost` sets `data-[variant=ghost]:max-w-full` and
 * `border-none` there, which is exactly how it escapes the 80% cap.
 *
 * Alignment is inherited, not repeated: `Bubble` reads
 * `group-data-[align=end]/message` from an enclosing `Message`, so setting
 * `align` on the message is enough. The `align` prop here is for bubbles used
 * outside a `Message`.
 *
 * Every part lands on a plain `<div>` — `className` is honestly a string, and
 * `BubbleContent` additionally takes Base UI's `render` prop, which is how a
 * bubble becomes a `<button>` or an `<a>` (the variants already style
 * `:hover` for those two).
 */

export type BubbleGroupProps = ComponentProps<typeof BubbleGroup>
export type BubbleProps = ComponentProps<typeof Bubble>
export type BubbleContentProps = ComponentProps<typeof BubbleContent>
export type BubbleReactionsProps = ComponentProps<typeof BubbleReactions>

/** The surface treatments. `ghost` is the one that removes the surface. */
export type BubbleVariant = NonNullable<BubbleProps['variant']>
/** Which side the bubble hugs when it is not inside an aligned `Message`. */
export type BubbleAlign = NonNullable<BubbleProps['align']>
/** Where the reactions strip pins itself on the bubble. */
export type BubbleReactionsSide = NonNullable<BubbleReactionsProps['side']>

export {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
}
