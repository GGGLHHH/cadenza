import type { ReactElement } from 'react'
import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Slider,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { MessageRow } from './message-row'
import { ResettableDemo } from './resettable'
import { SHORT_REPLIES, useFakeChat } from './transcript'

// scrollPreviousItemPeek is how much of the previous turn stays visible above
// a newly anchored row. At 0 the new turn starts on what looks like a blank
// page; the default 64 keeps enough of the last answer showing that the thread
// still reads as continuous. Set the peek, then send — it applies to the next
// anchored turn, not retroactively
function PreviousContextBody(): ReactElement {
  const [peek, setPeek] = useState(64)
  const { messages, sendNext } = useFakeChat(undefined, SHORT_REPLIES)

  return (
    <div className="flex flex-col gap-3 block-96">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs text-muted-foreground">
          peek
          {' '}
          {peek}
          px
        </span>
        <Slider
          aria-label="scrollPreviousItemPeek"
          className="flex-1"
          max={160}
          step={8}
          value={peek}
          onValueChange={setPeek}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={sendNext}
        >
          Send
        </Button>
      </div>
      <MessageScrollerProvider autoScroll scrollPreviousItemPeek={peek}>
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {messages.map(message => (
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
      </MessageScrollerProvider>
    </div>
  )
}

export default function PreviousContextDemo(): ReactElement {
  return (
    <ResettableDemo>
      <PreviousContextBody />
    </ResettableDemo>
  )
}
