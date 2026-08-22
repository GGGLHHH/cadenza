import type { ReactElement } from 'react'
import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { MessageRow } from './message-row'
import { ResettableDemo } from './resettable'
import { useFakeChat } from './transcript'

const PROMPTS = [
  'Move the Firebird before the interval.',
  'Can the Pavane open the second half instead?',
  'How long does that make the first half?',
]

// autoScroll follows a streamed reply only while the reader is still at the
// live edge. Start a reply, then scroll up while it is still arriving: the
// text keeps coming without dragging you back down. The jump button returns
// you to the edge and re-engages following
function StreamingBody(): ReactElement {
  const { messages, streaming, send } = useFakeChat()
  const [sent, setSent] = useState(0)

  return (
    <MessageScrollerProvider autoScroll>
      <div className="flex flex-col gap-3 block-96">
        <div className="flex items-center gap-3">
          <Button
            disabled={streaming}
            size="sm"
            variant="secondary"
            onClick={() => {
              const prompt = PROMPTS[sent % PROMPTS.length]
              if (prompt === undefined)
                return
              send(prompt)
              setSent(count => count + 1)
            }}
          >
            {streaming ? 'Streaming…' : 'Stream a reply'}
          </Button>
          <FollowState streaming={streaming} />
        </div>
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {messages.map(message => (
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

// `end` stays false while follow-output is pinning the reader to the live
// edge, so it doubles as "am I still following?" — no extra state needed.
function FollowState({ streaming }: { streaming: boolean }): ReactElement {
  const { end } = useMessageScrollerScrollable()

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {streaming && !end && 'Following the live edge'}
      {streaming && end && 'Released — text is arriving off-screen'}
      {!streaming && 'Idle'}
    </p>
  )
}

export default function StreamingDemo(): ReactElement {
  return (
    <ResettableDemo>
      <StreamingBody />
    </ResettableDemo>
  )
}
