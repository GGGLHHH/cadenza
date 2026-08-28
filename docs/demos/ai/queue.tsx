import type { WhenBusy } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { QueueList, useChat } from '@gedatou/cadenza-ai'
import { text } from '@gedatou/cadenza-ai/mock'
import { Button, ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { REPLIES } from './scripts'

// Proves the send queue: while a reply streams, three quick sends either wait
// in `chat.queue` (each with a cancel), are dropped, or interrupt the stream.
// The toggle picks the policy and every send passes it as `{ whenBusy }`,
// overriding the `queue` option `useChat` was created with. Each reply names
// the message it answers, so a dropped or interrupted send shows in the log;
// the long reply streams a little faster than the other demos so there is
// time to press all three buttons before it ends.
const POLICIES: readonly WhenBusy[] = ['queue', 'drop', 'interrupt']
const PROMPTS = ['First', 'Second', 'Third']

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(ctx => [text(`**Re: ${ctx.lastUserText}**\n\n${REPLIES.long}`)], { pace: 4 }))
  const chat = useChat({ fetcher, queue: { whenBusy: 'queue' } })
  const [whenBusy, setWhenBusy] = useState<WhenBusy>('queue')
  const send = (message: string): Promise<void> => chat.sendMessage(message, { whenBusy })
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup<WhenBusy>
          aria-label="When busy"
          size="sm"
          spacing={0}
          value={[whenBusy]}
          variant="outline"
          onValueChange={([next]) => {
            if (next !== undefined)
              setWhenBusy(next)
          }}
        >
          {POLICIES.map(policy => (
            <ToggleGroupItem key={policy} value={policy}>{policy}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        {PROMPTS.map(prompt => (
          <Button key={prompt} size="sm" variant="outline" onClick={() => void send(prompt)}>{prompt}</Button>
        ))}
      </div>
      {chat.queue.length > 0 && (
        <QueueList queue={chat.queue} onCancel={id => chat.cancelQueued(id)}>
          <p className="text-xs text-muted-foreground">Sends when the reply finishes.</p>
        </QueueList>
      )}
      <ChatShell chat={chat} empty="Press First, then Second and Third while the reply streams." onCommit={send} />
    </div>
  )
}

export default function QueueDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
