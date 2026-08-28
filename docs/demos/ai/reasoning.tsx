import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { reasoning, scripted, text } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'

// Proves the Reasoning part: it streams open with a shimmering trigger, folds
// itself once the thinking completes and shows how long it took — and a block
// the reader has toggled by hand stays where they left it (send a second turn).
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(() => [
    reasoning('Loudest work last; harps move once; interval after La Mer.', { chunk: 'word', pace: 60 }),
    text('Interval after La Mer.'),
  ]))
  const chat = useChat({ fetcher })
  return <ChatShell chat={chat} empty="Ask anything — the reply thinks first." />
}

export default function ReasoningDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
