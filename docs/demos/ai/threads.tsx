import type { ThreadDayLabel, ThreadIndex } from '@gedatou/cadenza-ai'
import type { ReactElement, ReactNode } from 'react'
import {
  createThreadIndex,
  groupThreadsByDay,
  indexedDBPersistence,
  newThreadId,
  ThreadList,
  ThreadListArchive,
  ThreadListDelete,
  ThreadListGroup,
  ThreadListGroupLabel,
  ThreadListItem,
  ThreadListNew,
  ThreadListRename,
  threadPersistence,
  useChat,
  useStoredState,
  useThreadIndex,
  useThreadListItem,
} from '@gedatou/cadenza-ai'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  cn,
  Dialog,
  DialogBody,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  SearchField,
} from '@gedatou/cadenza-ui'
import { IconMenu2, IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves the thread family: the index (localStorage) lists threads, the
// transcript (IndexedDB) lives under each id, and `threadPersistence` keeps
// them in step — the first message names the thread. New / switch / rename /
// archive / delete-with-confirmation / search / day groups; under `md:` the
// list moves into a dialog. Reset removes every thread through the same
// persistence, so nothing is left behind in either store.
const INDEX_KEY = 'docs-threads'
const CURRENT_KEY = 'docs-threads:current'

// Module-level like the persistence demo's adapter: the index only touches
// `localStorage` in the browser, and a remount must see the same, emptied index.
const index = createThreadIndex({ key: INDEX_KEY, storage: 'local' })
const persistence = threadPersistence(index, indexedDBPersistence({ databaseName: 'cadenza-ai-docs-threads' }))

type Persistence = ReturnType<typeof threadPersistence>

const DAY_LABELS: Record<ThreadDayLabel, string> = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' }

/**
 * The stored current id, falling back to a fresh draft id while nothing is
 * selected. The draft becomes a listed thread on its first persisted write
 * (`threadPersistence` upserts unknown ids), and is then adopted as current.
 */
export function useCurrentThread(threadIndex: ThreadIndex, key: string): [string, (id: string) => void] {
  const [stored, setStored] = useStoredState(key, '')
  const threads = useThreadIndex(threadIndex)
  // A fresh draft id whenever the stored id changes: derived from the previous
  // render, so deleting the current thread never lands on its own old id.
  const [draft, setDraft] = useState(newThreadId)
  const [previous, setPrevious] = useState(stored)
  if (stored !== previous) {
    setPrevious(stored)
    setDraft(newThreadId())
  }
  const current = threads.some(t => t.id === stored) ? stored : draft
  useEffect(() => {
    // The draft became a listed thread on its first persisted write: adopt it.
    if (current === draft && threads.some(t => t.id === draft))
      setStored(draft)
  }, [current, draft, threads, setStored])
  return [current, setStored]
}

// Confirmation is the caller's: the library's Delete only knows the index, so
// the confirm button also drops the transcript through the wrapped persistence.
function DeleteThread({ persistence: store }: { persistence: Persistence }): ReactElement {
  const { thread } = useThreadListItem()
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button aria-label="Delete thread" size="icon-xs" variant="ghost" />}>
        <IconTrash />
      </AlertDialogTrigger>
      <AlertDialogPopup size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
          <AlertDialogDescription>
            “
            {thread.title === '' ? 'Untitled' : thread.title}
            ” and its transcript leave this browser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<ThreadListDelete size="sm" variant="destructive" onClick={() => void store.removeItem(thread.id)} />}>
            Delete
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

export interface ThreadPaneProps {
  index: ThreadIndex
  persistence: Persistence
  value: string
  onValueChange: (id: string) => void
  /** Extra classes on the `md:` sidebar (the app layout widens and pads it). */
  sidebarClassName?: string
  /** Extra classes on the narrow-screen Threads button. */
  triggerClassName?: string
  /** Rendered under the list in the sidebar only. */
  footer?: ReactNode
}

function ThreadSidebar({ index: threadIndex, persistence: store, value, onValueChange, className, footer }: Pick<ThreadPaneProps, 'index' | 'persistence' | 'value' | 'onValueChange' | 'footer'> & { className?: string }): ReactElement {
  const threads = useThreadIndex(threadIndex)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = needle === '' ? threads : threads.filter(t => `${t.title} ${t.preview}`.toLowerCase().includes(needle))
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <SearchField aria-label="Search threads" placeholder="Search threads…" value={query} onValueChange={setQuery} />
      <ThreadList className="flex-1 min-block-0" index={threadIndex} threads={visible} value={value} onValueChange={onValueChange}>
        <ThreadListNew size="sm">New thread</ThreadListNew>
        {groupThreadsByDay(visible).map(group => (
          <ThreadListGroup key={group.label}>
            <ThreadListGroupLabel>{DAY_LABELS[group.label]}</ThreadListGroupLabel>
            {group.threads.map(thread => (
              <ThreadListItem
                key={thread.id}
                className="data-archived:opacity-60"
                thread={thread}
              >
                <ThreadListRename aria-label="Rename thread" />
                <ThreadListArchive aria-label={thread.archived ? 'Unarchive thread' : 'Archive thread'} />
                <DeleteThread persistence={store} />
              </ThreadListItem>
            ))}
          </ThreadListGroup>
        ))}
      </ThreadList>
      {footer}
    </div>
  )
}

/** The list beside the chat from `md:` up; below it, a button that opens the same list in a dialog. */
export function ThreadPane({ sidebarClassName, triggerClassName, footer, ...props }: ThreadPaneProps): ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ThreadSidebar
        {...props}
        footer={footer}
        className={cn(`
          hidden shrink-0 border-e pe-3 inline-64
          md:flex
        `, sidebarClassName)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={(
          <Button
            className={cn(`
              self-start
              md:hidden
            `, triggerClassName)}
            size="sm"
            variant="outline"
          />
        )}
        >
          <IconMenu2 />
          Threads
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Threads</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ThreadSidebar
              {...props}
              className="block-96"
              onValueChange={(id) => {
                props.onValueChange(id)
                setOpen(false)
              }}
            />
          </DialogBody>
        </DialogPopup>
      </Dialog>
    </>
  )
}

function Chat({ threadId }: { threadId: string }): ReactElement {
  const [fetcher] = useState(() => mockFetcher(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime], persistence, threadId })
  return <ChatShell chat={chat} empty="Each thread keeps its own transcript; the first message names it." />
}

function Workspace(): ReactElement {
  const [threadId, setThreadId] = useCurrentThread(index, CURRENT_KEY)
  return (
    <div className="
      flex flex-col gap-3
      md:flex-row
    "
    >
      <ThreadPane index={index} persistence={persistence} value={threadId} onValueChange={setThreadId} />
      <div className="flex flex-1 flex-col min-inline-0">
        <Chat key={threadId} threadId={threadId} />
      </div>
    </div>
  )
}

async function wipe(): Promise<void> {
  for (const thread of index.list())
    await persistence.removeItem(thread.id)
  localStorage.removeItem(CURRENT_KEY)
}

export default function ThreadsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-3xl" onReset={wipe}>
      <Workspace />
    </ResettableDemo>
  )
}
