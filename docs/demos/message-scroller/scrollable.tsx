import type { ReactElement } from 'react'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
} from '@gedatou/cadenza-ui'
import { MessageRow } from './message-row'
import { ResettableDemo } from './resettable'
import { TRANSCRIPT } from './transcript'

// Which edges still have room, in JavaScript. Scroll the transcript and
// watch both flags flip; `!start` means the reader is at the top, `!end`
// that they are at the live edge. For styling the scroller itself the
// data-scrollable attribute says the same thing without a rerender
function ScrollableBody(): ReactElement {
  return (
    <MessageScrollerProvider>
      <div className="flex flex-col gap-3 block-96">
        <ScrollState />
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {TRANSCRIPT.map(message => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === 'user'}
                >
                  <MessageRow message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  )
}

function ScrollState(): ReactElement {
  const { start, end } = useMessageScrollerScrollable()

  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      {start ? 'More above' : 'At the top'}
      {' · '}
      {end ? 'More below' : 'At the live edge'}
    </p>
  )
}

export default function ScrollableDemo(): ReactElement {
  return (
    <ResettableDemo>
      <ScrollableBody />
    </ResettableDemo>
  )
}
