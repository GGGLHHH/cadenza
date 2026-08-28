import type { ReactElement } from 'react'
import { indexedDBPersistence, useChat } from '@gedatou/cadenza-ai'
import { scripted } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves persistence: the thread is written to IndexedDB as it grows, so a
// page reload restores it with no network; Reset wipes the database before
// remounting. The database name is this demo's own.
const DATABASE = 'cadenza-ai-docs-persistence'
const persistence = indexedDBPersistence({ databaseName: DATABASE })

function wipe(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error(`Could not delete ${DATABASE}.`))
  })
}

function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime], persistence, threadId: 'docs-persistence' })
  return <ChatShell chat={chat} empty="Say something, then reload the page." />
}

export default function PersistenceDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl" onReset={wipe}>
      <Body />
    </ResettableDemo>
  )
}
