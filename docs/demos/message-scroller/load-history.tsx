import type { ReactElement } from 'react'
import type { ChatMessage } from './transcript'
import {
  Button,
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Spinner,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { MessageRow } from './message-row'
import { EARLIER, TRANSCRIPT } from './transcript'

// Prepending older rows must not move the row the reader is looking at.
// Scroll up to the load row, load, and watch the message under your eyes
// stay put — then turn preserveScrollOnPrepend off and load again to see
// what the viewport does without it
function LoadHistoryBody(): ReactElement {
  const [earlier, setEarlier] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [preserve, setPreserve] = useState(true)
  const exhausted = earlier.length >= EARLIER.length

  return (
    <div className="flex flex-col gap-3 block-96">
      <Button
        aria-pressed={preserve}
        size="sm"
        variant={preserve ? 'default' : 'outline'}
        onClick={() => setPreserve(on => !on)}
      >
        {preserve ? 'preserveScrollOnPrepend on' : 'preserveScrollOnPrepend off'}
      </Button>
      <MessageScrollerProvider defaultScrollPosition="start">
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport preserveScrollOnPrepend={preserve}>
            {/* Inside the scrolling element, outside the content: the
                scroller detects a prepend by checking whether the row that
                used to be first has moved down, so a permanent first row
                inside the content would hide every prepend from it */}
            <div className="flex justify-center pbs-4">
              {loading
                ? <Spinner className="text-muted-foreground" />
                : (
                    <Button
                      disabled={exhausted}
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setLoading(true)
                        window.setTimeout(() => {
                          setEarlier(EARLIER)
                          setLoading(false)
                        }, 400)
                      }}
                    >
                      {exhausted ? 'Beginning of the conversation' : 'Load earlier messages'}
                    </Button>
                  )}
            </div>
            <MessageScrollerContent className="gap-8 p-5">
              {[...earlier, ...TRANSCRIPT].map(message => (
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
      </MessageScrollerProvider>
    </div>
  )
}

export default function LoadHistoryDemo(): ReactElement {
  return (
    <ResettableDemo>
      <LoadHistoryBody />
    </ResettableDemo>
  )
}
