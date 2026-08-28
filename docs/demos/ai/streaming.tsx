import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { scripted, text } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { REPLIES } from './scripts'

// Proves the stream is live: the reply lands word by word, the submit button
// is Stop while it does, and stopping hands `chat.status` back to `ready`
// with no error.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(() => [text(REPLIES.long, { chunk: 'word', pace: 40 })]))
  const chat = useChat({ fetcher })
  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-xs text-muted-foreground">
        status:
        {' '}
        {chat.status}
      </p>
      <ChatShell chat={chat} empty="Send anything — the reply is long enough to stop." />
    </div>
  )
}

export default function StreamingDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
