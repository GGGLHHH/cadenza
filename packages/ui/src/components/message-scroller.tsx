'use client'

import type { ComponentProps, ReactElement } from 'react'
import type { ScrollAreaScrollbars } from './scroll-area'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { MessageScroller as MessageScrollerHeadless } from '@shadcn/react/message-scroller'
import { cn } from '#lib/utils'
import {
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScroller as MessageScrollerStyled,
} from '#primitives/message-scroller'
import { ScrollArea } from './scroll-area'

/**
 * The published MessageScroller family.
 *
 * A transcript scroller: it anchors each turn near the top of the viewport,
 * follows a streaming reply only while the reader is still at the live edge,
 * keeps the visible row still when older history is prepended above, and jumps
 * to any message by id. The rule underneath all four is the same one — never
 * move the reader against their intent.
 *
 * Unlike the rest of this library the behaviour is not Base UI's: it comes from
 * shadcn's headless `@shadcn/react/message-scroller`, which shadcn skins in the
 * vendored file this seam mostly promotes. None of that behaviour is rewritten
 * here. The seam does three things: it names the prop types (upstream declares
 * them inline, so a caller had nothing to import), it stops one type from
 * promising something the element cannot keep (the root's `ref`), and it
 * rebuilds one part — the viewport scrolls on this library's `ScrollArea`
 * instead of shadcn's native scrollbar, which is what lets the fade mask both
 * edges without dimming the bar along with the content.
 *
 * ```tsx
 * <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
 *   <MessageScroller>
 *     <MessageScrollerViewport>
 *       <MessageScrollerContent>
 *         {messages.map(message => (
 *           <MessageScrollerItem
 *             key={message.id}
 *             messageId={message.id}
 *             scrollAnchor={message.role === 'user'}
 *           >
 *             …
 *           </MessageScrollerItem>
 *         ))}
 *       </MessageScrollerContent>
 *     </MessageScrollerViewport>
 *     <MessageScrollerButton />
 *   </MessageScroller>
 * </MessageScrollerProvider>
 * ```
 *
 * `MessageScrollerProvider` is a separate part rather than folded into the root
 * because it owns the scroll state: sitting above the frame is what lets a
 * "jump to message" control *outside* the scroller reach `useMessageScroller`.
 * Parts used without it throw rather than render dead.
 *
 * Every part lands on a plain `<div>` (the button on a `<button>`), so
 * `className` is honestly a string here — there is no Base UI state function to
 * pass. Style off state through the attributes the scroller writes instead:
 * `data-scrollable` (`"start"`, `"end"` or `"start end"` — which directions have
 * room left, absent when neither does), `data-autoscrolling` (present while a
 * programmatic scroll is in flight) on the root and the viewport, and
 * `data-active="true" | "false"` on the button. The root carries
 * `group/message-scroller`, so the viewport and the content can read those two
 * through `group-data-*`.
 */

export type MessageScrollerProviderProps = ComponentProps<typeof MessageScrollerProvider>
export type MessageScrollerViewportProps
  = Omit<ComponentProps<typeof MessageScrollerHeadless.Viewport>, 'className'> & {
    /**
     * Unlike its siblings this one takes the function form too, because it no
     * longer lands on a plain `<div>`: `cn` routes it to Base UI's viewport
     * slot, which resolves it against `ScrollAreaViewportState` — `scrolling`,
     * `hasOverflowX/Y` and the four overflow-edge flags.
     */
    className?: ScrollAreaPrimitive.Viewport.Props['className']
    /**
     * Which scrollbars to render — `ScrollArea`'s vocabulary and its three
     * values, since underneath this *is* a `ScrollArea`.
     */
    scrollbars?: ScrollAreaScrollbars
  }
export type MessageScrollerContentProps = ComponentProps<typeof MessageScrollerContent>
export type MessageScrollerButtonProps = ComponentProps<typeof MessageScrollerButton>

/**
 * `messageId` stays optional, as upstream types it, but a row without one is
 * only half a row: it still counts as a turn for anchoring, and it is still
 * measured, yet `scrollToMessage` cannot address it and it never appears in
 * `useMessageScrollerVisibility().visibleMessageIds`. Leave it off only for rows
 * that are not messages — a date separator, an unread marker.
 *
 * One constraint no type can express: the scroller recognises a prepend by
 * checking whether the row that used to be first has moved down the list. A row
 * that is *permanently* first — a "load earlier" button, a start-of-thread
 * marker — hides every prepend behind it, and the viewport treats the incoming
 * history as an append instead, scrolling away from the reader (measured:
 * 1332px of drift). Render those controls inside the viewport but outside the
 * content, so they never enter the row list.
 */
export type MessageScrollerItemProps = ComponentProps<typeof MessageScrollerItem>

/**
 * The root's own `ref` is dropped, and this is the one place the seam narrows
 * upstream.
 *
 * The headless root renders `<div ref={setRootElement} {...props}>` — its own
 * ref *before* the spread, so a caller-supplied one replaces it instead of
 * merging. The element then never reaches the scroller, and `data-scrollable` /
 * `data-autoscrolling` stop being written to the root (the viewport keeps
 * both), silently killing every `group-data-*` style hanging off
 * `group/message-scroller`. Typing the prop while it breaks the component is the
 * half-open door this library refuses; the honest surface is not to offer it.
 *
 * Need the scrolling element? That is `MessageScrollerViewport`, whose ref *is*
 * merged. Need a box around the frame? Wrap it in your own `<div>`.
 */
export type MessageScrollerProps = Omit<ComponentProps<typeof MessageScrollerStyled>, 'ref'>

/**
 * Which edge the button scrolls to, and which edge it watches for room.
 * Upstream declares it inline on the prop, so the seam names it.
 */
export type MessageScrollerButtonDirection = NonNullable<MessageScrollerButtonProps['direction']>

/**
 * What `MessageScrollerButton`'s `render` function receives: `active` is false
 * when there is nothing left to scroll in `direction`, which is also when the
 * button goes `inert` and drops out of the tab order.
 *
 * Read off the `render` signature rather than written out, because upstream
 * declares the shape but does not export it — this way it tracks upstream
 * instead of drifting from it.
 */
export type MessageScrollerButtonState
  = Parameters<Extract<NonNullable<MessageScrollerButtonProps['render']>, (...args: never[]) => unknown>>[1]

// A cast, not a wrapper: every prop already reaches the root through a plain
// spread, so only the type needed correcting.
const MessageScroller = MessageScrollerStyled as (props: MessageScrollerProps) => ReactElement

/**
 * The scrolling element — and the one part the seam builds itself rather than
 * promoting, because the vendored viewport scrolls the shadcn way and this
 * library scrolls its own way.
 *
 * shadcn styles the viewport with a thin native scrollbar and `scroll-fade-b`.
 * Both are wrong here, and neither can be undone from the outside: a native bar
 * lives *inside* the element the fade masks, so it dims along with the content
 * (the very reason `ScrollArea` exists in this library — its bars are siblings
 * of the scrolling element), and `scroll-fade-b` sets `--scroll-fade-mask`,
 * which is defined later in styles.css than `scroll-fade-y`'s — so a caller
 * appending `scroll-fade-y` still gets the bottom-only fade. Overriding was
 * never on the table; the seam builds the part instead, on the same headless
 * `MessageScroller.Viewport` the vendored file wraps.
 *
 * It is a `ScrollArea` with the headless transcript viewport fused onto its
 * viewport through `viewportRender` — one element, which it must be: the
 * scroller measures, anchors and preserves position against the element it
 * scrolls, and `scroll(self y)` (what drives the fade) only reads the scroll
 * container itself. Both sides merge rather than replace: Base UI's ref joins
 * the scroller's through `useRenderElement`, and each side's handlers both run
 * — the scroller's own first, then the caller's (`Y(v){ L(); onScroll?.(v) }`
 * upstream). Going through `ScrollArea` rather than hand-assembling the Base UI
 * parts is what keeps the focus ring, the `scrollbars` vocabulary and the
 * hover recipe from drifting away from every other scroll surface here.
 *
 * The children are wrapped in Base UI's `ScrollArea.Content` because that part
 * carries the only content-size observer Base UI has: the viewport recomputes
 * its overflow state on scroll, on its *own* box resizing, and nothing else. A
 * transcript that fits at mount and then grows — the first thing every chat
 * does — would otherwise leave Base UI believing nothing overflows: no
 * scrollbar mounted, `tabIndex` stuck at `-1`, even as the headless side is
 * already writing `data-scrollable="end"`.
 */
export function MessageScrollerViewport({
  children,
  className,
  scrollbars = 'hover',
  ...props
}: MessageScrollerViewportProps): ReactElement {
  return (
    <ScrollArea
      // `flex-1 min-block-0` is what lets it take the frame's remaining height;
      // its own viewport is `block-full`, which resolves against that.
      className="flex-1 min-block-0"
      scrollbars={scrollbars}
      viewportClassName={cn('scroll-fade-y overscroll-contain contain-content', className)}
      // `role` restated because Base UI stamps `role="presentation"` on its
      // viewport, and render-element props win the merge — without this the
      // transcript would stop being a landmark. Before `{...props}`, so a
      // caller can still say otherwise. `aria-label` needs no such rescue:
      // Base UI writes none, so the scroller's own "Messages" survives.
      viewportRender={(
        <MessageScrollerHeadless.Viewport
          data-slot="message-scroller-viewport"
          role="region"
          {...props}
        />
      )}
    >
      <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
    </ScrollArea>
  )
}

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
}

/**
 * `useMessageScroller` returns the three imperative jumps (`scrollToEnd`,
 * `scrollToMessage`, `scrollToStart`); `useMessageScrollerScrollable` reports
 * which directions still have room; `useMessageScrollerVisibility` reports the
 * current anchor and the visible message ids, and only starts an
 * IntersectionObserver once something subscribes to it.
 */
export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '#primitives/message-scroller'

export type {
  MessageScrollerDefaultScrollPosition,
  MessageScrollerScrollable,
  MessageScrollerScrollAlign,
  MessageScrollerScrollOptions,
  MessageScrollerVisibilityState,
} from '@shadcn/react/message-scroller'
