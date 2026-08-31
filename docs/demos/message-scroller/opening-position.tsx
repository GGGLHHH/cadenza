import type { MessageScrollerDefaultScrollPosition } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { MessageRow } from './message-row'
import { TRANSCRIPT } from './transcript'

const POSITIONS: MessageScrollerDefaultScrollPosition[] = ['start', 'end', 'last-anchor']

// Where a saved thread reopens. `last-anchor` lands on the final meaningful
// turn — the question, with its answer below — instead of the absolute bottom,
// which drops the reader in mid-answer with no idea what was asked.
// The key remounts the provider on purpose: the opening position is applied
// once, on the first non-empty render, so changing the prop alone does nothing
function OpeningPositionBody(): ReactElement {
  const [position, setPosition] = useState<MessageScrollerDefaultScrollPosition>('last-anchor')

  return (
    <div className="flex flex-col gap-3 block-96">
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map(value => (
          <Button
            aria-pressed={value === position}
            key={value}
            size="sm"
            variant={value === position ? 'default' : 'outline'}
            onClick={() => setPosition(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <MessageScrollerProvider defaultScrollPosition={position} key={position}>
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
      </MessageScrollerProvider>
    </div>
  )
}

export default function OpeningPositionDemo(): ReactElement {
  return (
    <ResettableDemo>
      <OpeningPositionBody />
    </ResettableDemo>
  )
}
