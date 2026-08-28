import type { ComponentProps } from 'react'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '#primitives/message'

/**
 * The published Message family — the row layout of one turn.
 *
 * It owns everything around the text: which side the turn sits on, whether an
 * avatar rides along, and the small print above and below. The text itself
 * belongs to `Bubble`, and the scroll container around the whole transcript is
 * `MessageScroller`.
 *
 * ```tsx
 * <Message align="end">
 *   <MessageAvatar>…</MessageAvatar>
 *   <MessageContent>
 *     <MessageHeader>You</MessageHeader>
 *     <Bubble variant="muted">
 *       <BubbleContent>Where does the interval go?</BubbleContent>
 *     </Bubble>
 *     <MessageFooter>18:42</MessageFooter>
 *   </MessageContent>
 * </Message>
 * ```
 *
 * `align` is the whole alignment story. It writes `data-align` on the root,
 * which flips the row direction and — through `group-data-[align=end]/message`
 * — pulls the bubble, header and footer to the same side. Nothing downstream
 * needs to be told again.
 *
 * Two pieces of layout worth knowing before you fight them:
 * `MessageAvatar` sits at the *bottom* of the row and lifts itself by 2rem when
 * the message has a footer, so it stays beside the text rather than beside the
 * timestamp; and `MessageHeader` / `MessageFooter` carry a 0.75rem inset that
 * lines them up with a padded bubble, then drop it against a `ghost` one.
 *
 * Every part is a plain `<div>`, so `className` is honestly a string — style
 * off `data-align` rather than reaching for a state function.
 */

export type MessageGroupProps = ComponentProps<typeof MessageGroup>
export type MessageProps = ComponentProps<typeof Message>
export type MessageAvatarProps = ComponentProps<typeof MessageAvatar>
export type MessageContentProps = ComponentProps<typeof MessageContent>
export type MessageHeaderProps = ComponentProps<typeof MessageHeader>
export type MessageFooterProps = ComponentProps<typeof MessageFooter>

/** Which side the turn sits on. Read downstream as `data-align`. */
export type MessageAlign = NonNullable<MessageProps['align']>

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
}
