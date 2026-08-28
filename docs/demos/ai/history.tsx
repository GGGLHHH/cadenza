import type { UIMessage } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import {
  Composer,
  ComposerSubmit,
  ComposerTextarea,
  ComposerToolbar,
  Transcript,
  TranscriptMessage,
  TranscriptPending,
  TranscriptProvider,
  useChat,
} from '@gedatou/cadenza-ai'
import { echo } from '@gedatou/cadenza-ai/mock'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { EARLIER, TRANSCRIPT } from '../message-scroller/transcript'
import { mockFetcher } from './mock'

// Proves history paging: older rows prepended through `chat.setMessages` do
// not move the row the reader is looking at — `Transcript` forwards
// `preserveScrollOnPrepend` (default on) to the viewport, and stable message
// ids give it a row to hold. The "Load earlier" control sits above the
// transcript, outside the message list: the scroller recognises a prepend by
// the old first row moving down, so a permanent first row inside the list
// would hide every prepend from it.

const PAGE = 4

// The rehearsal thread from the MessageScroller demos, as UIMessages.
const HISTORY: UIMessage[] = [...EARLIER, ...TRANSCRIPT].map((message): UIMessage => ({
  id: message.id,
  role: message.role,
  parts: [{ type: 'text', content: message.content }],
}))
const INITIAL = HISTORY.slice(-PAGE)

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(echo()))
  const chat = useChat({ fetcher, initialMessages: INITIAL })
  // Index of the oldest loaded row in HISTORY; 0 means the whole thread is in.
  const [cursor, setCursor] = useState(HISTORY.length - PAGE)
  const last = chat.messages.at(-1)
  const exhausted = cursor === 0

  const loadEarlier = (): void => {
    const next = Math.max(0, cursor - PAGE)
    chat.setMessages([...HISTORY.slice(next, cursor), ...chat.messages])
    setCursor(next)
  }

  return (
    <TranscriptProvider status={chat.status}>
      <div className="flex flex-col rounded-xl border block-120">
        <div className="flex justify-center border-be p-2">
          <Button size="sm" variant="ghost" disabled={exhausted || chat.status !== 'ready'} onClick={loadEarlier}>
            {exhausted ? 'Beginning of the conversation' : `Load earlier (${cursor} more)`}
          </Button>
        </div>
        <Transcript>
          {chat.messages.map(message => (
            <TranscriptMessage key={message.id} message={message} streaming={chat.status === 'streaming' && message === last} />
          ))}
          {chat.status === 'submitted' && <TranscriptPending>Thinking…</TranscriptPending>}
        </Transcript>
        <Composer
          status={chat.status}
          onValueCommitted={text => void chat.sendMessage(text)}
          onStop={() => chat.stop()}
          className="border-bs p-2"
        >
          <ComposerTextarea placeholder="Ask about the programme…" />
          <ComposerToolbar>
            <ComposerSubmit className="ms-auto" />
          </ComposerToolbar>
        </Composer>
      </div>
    </TranscriptProvider>
  )
}

export default function HistoryDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
