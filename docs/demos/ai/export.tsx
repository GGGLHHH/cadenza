import type { ReactElement } from 'react'
import { messagesToMarkdown, useChat } from '@gedatou/cadenza-ai'
import { Button, Textarea } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves export and import: `messagesToMarkdown` renders the thread as
// Markdown, JSON is `chat.messages` serialised, and `chat.setMessages` takes
// that JSON back — Export JSON, Clear, Import JSON restores the thread.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime] })
  const [out, setOut] = useState('')
  const empty = chat.messages.length === 0
  return (
    <div className="flex flex-col gap-2">
      <ChatShell
        chat={chat}
        empty="Try: “Plan the programme.”, then export."
        toolbar={(
          <>
            <Button size="xs" variant="outline" disabled={empty} onClick={() => setOut(messagesToMarkdown(chat.messages, { title: 'Rehearsal plan' }))}>
              Export Markdown
            </Button>
            <Button size="xs" variant="outline" disabled={empty} onClick={() => setOut(JSON.stringify(chat.messages, null, 2))}>
              Export JSON
            </Button>
            <Button size="xs" variant="outline" disabled={empty} onClick={() => chat.clear()}>
              Clear
            </Button>
            <Button size="xs" variant="outline" disabled={!out.startsWith('[')} onClick={() => chat.setMessages(JSON.parse(out) as Parameters<typeof chat.setMessages>[0])}>
              Import JSON
            </Button>
          </>
        )}
      />
      <Textarea
        aria-label="Export"
        value={out}
        onChange={event => setOut(event.target.value)}
        rows={6}
        className="font-mono text-xs"
      />
    </div>
  )
}

export default function ExportDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
