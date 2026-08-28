import type { ReactElement } from 'react'
import type { ChatMessage } from './transcript'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from '@gedatou/cadenza-ui'
import { ResettableDemo } from '../lib/resettable'
import { MessageRow } from './message-row'
import { TRANSCRIPT } from './transcript'

const TURNS = TRANSCRIPT.filter(message => message.role === 'user')

// The outline sits outside the MessageScroller frame and still drives it:
// the hooks read from MessageScrollerProvider, so anything inside the
// provider can jump the transcript or ask where the reader is
function CommandsBody(): ReactElement {
  return (
    <MessageScrollerProvider>
      <div className="flex gap-3 block-96">
        <Outline />
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
          <MessageScrollerButton />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  )
}

function Outline(): ReactElement {
  const { scrollToMessage } = useMessageScroller()
  const { currentAnchorId } = useMessageScrollerVisibility()

  return (
    <nav
      aria-label="Turns"
      className="flex shrink-0 flex-col gap-1 overflow-y-auto inline-56"
    >
      {TURNS.map((turn: ChatMessage, index) => (
        <button
          aria-current={turn.id === currentAnchorId}
          className="
            truncate rounded-md px-2 py-1 text-start text-xs
            text-muted-foreground
            hover:bg-muted
            aria-current:bg-muted aria-current:text-foreground
          "
          key={turn.id}
          type="button"
          onClick={() => scrollToMessage(turn.id, { align: 'start' })}
        >
          {index + 1}
          .
          {' '}
          {turn.content}
        </button>
      ))}
    </nav>
  )
}

export default function CommandsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <CommandsBody />
    </ResettableDemo>
  )
}
