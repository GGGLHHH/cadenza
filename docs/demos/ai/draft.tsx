import type { ReactElement } from 'react'
import { indexedDBPersistence, useChat, useStoredState } from '@gedatou/cadenza-ai'
import { echo } from '@gedatou/cadenza-ai/mock'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves drafts: the composer is controlled by `useStoredState` under a key
// per thread, so typing half a message, switching threads and switching back
// finds the draft where it was left — and a reload finds it too. Switching
// remounts the chat by `key`; each thread's transcript comes back from
// IndexedDB the same way. Reset drops both transcripts and both drafts.
const THREADS = ['a', 'b'] as const
const persistence = indexedDBPersistence({ databaseName: 'cadenza-ai-docs-draft' })

function draftKey(threadId: string): string {
  return `docs-draft:${threadId}`
}

function Chat({ threadId }: { threadId: string }): ReactElement {
  const [fetcher] = useState(() => mockFetcher(echo()))
  const chat = useChat({ fetcher, persistence, threadId })
  const [draft, setDraft] = useStoredState(draftKey(threadId), '')
  return (
    <ChatShell
      chat={chat}
      value={draft}
      onValueChange={setDraft}
      placeholder={`Draft for thread ${threadId.toUpperCase()}…`}
      empty="Type half a message, switch threads, come back."
      className="block-96"
    />
  )
}

function Body(): ReactElement {
  const [threadId, setThreadId] = useState<string>(THREADS[0])
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        aria-label="Thread"
        size="sm"
        spacing={0}
        value={[threadId]}
        variant="outline"
        onValueChange={([next]) => {
          if (next !== undefined)
            setThreadId(next)
        }}
      >
        {THREADS.map(id => (
          <ToggleGroupItem key={id} value={id}>
            Thread
            {' '}
            {id.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Chat key={threadId} threadId={threadId} />
    </div>
  )
}

async function wipe(): Promise<void> {
  for (const id of THREADS) {
    await persistence.removeItem(id)
    localStorage.removeItem(draftKey(id))
  }
}

export default function DraftDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl" onReset={wipe}>
      <Body />
    </ResettableDemo>
  )
}
