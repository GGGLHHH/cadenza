import type { ReactElement } from 'react'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerVisibility,
} from '@gedatou/cadenza-ui'
import { ResettableDemo } from '../lib/resettable'
import { MessageRow } from './message-row'
import { TRANSCRIPT } from './transcript'

const ANCHORS = TRANSCRIPT.filter(message => message.role === 'user').map(message => message.id)

// Where the reader is, and what they can see. currentAnchorId answers
// "which turn am I in" — it keeps its value after the anchor scrolls off the
// top — while visibleMessageIds answers "what is on screen right now", in
// document order. Scroll and watch both change; the tracking only runs
// because this demo subscribes to the hook
function VisibilityBody(): ReactElement {
  return (
    <MessageScrollerProvider>
      <div className="flex flex-col gap-3 block-96">
        <ReadingPosition />
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {TRANSCRIPT.map(message => (
                <MessageScrollerItem
                  className="
                    border-s-2 border-transparent ps-3
                    data-[scroll-anchor=true]:border-primary
                  "
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === 'user'}
                >
                  <MessageRow message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  )
}

function ReadingPosition(): ReactElement {
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()
  const turn = currentAnchorId === null ? 0 : ANCHORS.indexOf(currentAnchorId) + 1

  return (
    <p aria-live="polite" className="text-xs text-muted-foreground">
      {turn === 0 ? 'Before the first turn' : `Turn ${turn} of ${ANCHORS.length}`}
      {' · '}
      {visibleMessageIds.length}
      {visibleMessageIds.length === 1 ? ' row' : ' rows'}
      {' on screen'}
    </p>
  )
}

export default function VisibilityDemo(): ReactElement {
  return (
    <ResettableDemo>
      <VisibilityBody />
    </ResettableDemo>
  )
}
