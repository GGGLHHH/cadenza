import type { ComponentProps } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '#primitives/marker'

/**
 * The published Marker family — the rows in a transcript that are not messages.
 *
 * "Marcus joined the chat", a date break, "Thinking…", a tool that is running,
 * an unread divider. Anything the conversation needs to say about itself rather
 * than in it.
 *
 * ```tsx
 * <Marker variant="separator">
 *   <MarkerContent>Today</MarkerContent>
 * </Marker>
 * ```
 *
 * Three shapes, and the difference is entirely in the rule around the text:
 * `default` is a bare line, `separator` grows a hairline out to both edges and
 * centres the label between them, `border` underlines the row. All three keep
 * the muted, small type — a marker should never compete with a message.
 *
 * For a marker that reports live progress ("Thinking…", "Running search") pass
 * `role="status"` so it is announced, and reach for the `shimmer` utility on
 * `MarkerContent` rather than a spinner: the text itself is the indicator.
 *
 * A marker is a legitimate `scrollAnchor` — in a group thread the turn boundary
 * is often the join event, not a message. See MessageScroller's group-chat
 * example.
 *
 * `Marker` takes Base UI's `render` prop, so it can become an `<a>` or a
 * `<button>` when the note is actionable (its variants already style links).
 * `className` is a string on every part: the root funnels it through `cva`,
 * which drops a function instead of resolving it — style off `data-variant`
 * instead.
 */

export type MarkerProps = ComponentProps<typeof Marker>
export type MarkerIconProps = ComponentProps<typeof MarkerIcon>
export type MarkerContentProps = ComponentProps<typeof MarkerContent>

/** The three row shapes. Mirrored as `data-variant`. */
export type MarkerVariant = NonNullable<MarkerProps['variant']>

export { Marker, MarkerContent, MarkerIcon }
export { markerVariants } from '#primitives/marker'
