import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { scripted } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves the whole loop without a key: a scripted reply that thinks, calls a
// tool, streams Markdown and reports usage — and the transcript follows it.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime] })
  return <ChatShell chat={chat} empty="Try: “Plan the programme.”" />
}

export default function BasicDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
