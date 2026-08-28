import type { ReactElement } from 'react'
import { Transcript, TranscriptEmpty, TranscriptMessage, TranscriptPending, TranscriptProvider, useChat } from '@gedatou/cadenza-ai'
import { text, tool } from '@gedatou/cadenza-ai/mock'
import { Button, Marker } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { mockFetcher } from './mock'
import { getTime } from './tools'

// Proves grouping: three consecutive tool calls in one reply fold into a
// single `ToolCallGroup` (`data-count="3"`) behind one trigger, and expanding
// it shows the three cards; the Markdown answer that follows stays outside.
// The date row above the first message is a `Marker variant="separator"` the
// caller draws — the transcript is a log, so any row can go between messages.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(() => [
    tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
    tool('get_time', { tz: 'Europe/London' }, { output: { iso: '2026-10-14T18:30:00+01:00' } }),
    tool('get_time', { tz: 'America/New_York' }, { output: { iso: '2026-10-14T13:30:00-04:00' } }),
    text('Paris downbeat at **19:30** is 18:30 in London and 13:30 in New York — the remote section leaders can all join the call.'),
  ]))
  const chat = useChat({ fetcher, tools: [getTime] })
  const last = chat.messages.at(-1)
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={chat.status !== 'ready'}
        onClick={() => void chat.sendMessage('When is the downbeat for everyone?')}
      >
        Send
      </Button>
      <TranscriptProvider status={chat.status}>
        <div className="flex flex-col rounded-xl border block-120">
          <Transcript>
            {chat.messages.length === 0
              ? <TranscriptEmpty>Press Send: three time-zone lookups arrive as one group.</TranscriptEmpty>
              : <Marker variant="separator">Today</Marker>}
            {chat.messages.map(message => (
              <TranscriptMessage key={message.id} message={message} streaming={chat.status === 'streaming' && message === last} />
            ))}
            {chat.status === 'submitted' && <TranscriptPending>Thinking…</TranscriptPending>}
          </Transcript>
        </div>
      </TranscriptProvider>
    </div>
  )
}

export default function ToolGroupDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
