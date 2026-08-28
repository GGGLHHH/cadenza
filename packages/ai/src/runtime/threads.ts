'use client'
import type { ChatClientPersistence, ChatPersistedState, UIMessage } from '@tanstack/ai-client'
import { useSyncExternalStore } from 'react'

export interface ThreadMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  preview: string
  archived: boolean
  provider?: string
  model?: string
}

/**
 * The list side of thread storage. TanStack AI's `ChatClientPersistence` is a
 * per-thread key/value store with no enumeration, so the index keeps the
 * metadata (`ThreadMeta`) apart from the transcripts; `threadPersistence()`
 * keeps the two in step.
 */
export interface ThreadIndex {
  /** Newest first; archived threads after live ones. Stable reference until the next write. */
  list: () => readonly ThreadMeta[]
  get: (id: string) => ThreadMeta | undefined
  create: (init?: Partial<ThreadMeta>) => ThreadMeta
  /** Upserts: an unknown id is created with `createdAt = now`. */
  touch: (id: string, patch: Partial<Omit<ThreadMeta, 'id'>>) => ThreadMeta
  rename: (id: string, title: string) => void
  archive: (id: string, archived: boolean) => void
  remove: (id: string) => void
  subscribe: (listener: () => void) => () => void
}

export interface ThreadIndexOptions {
  /** `localStorage` key. Default `cadenza-ai:threads`. */
  key?: string
  /** `'local'` (default) persists across reloads and tabs; `'memory'` is per page. */
  storage?: 'local' | 'memory'
}

export function newThreadId(): string {
  return `thread-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function sortThreads(threads: readonly ThreadMeta[]): ThreadMeta[] {
  return [...threads].sort((a, b) => Number(a.archived) - Number(b.archived) || b.updatedAt - a.updatedAt)
}

export function createThreadIndex(options: ThreadIndexOptions = {}): ThreadIndex {
  const key = options.key ?? 'cadenza-ai:threads'
  const local = (options.storage ?? 'local') === 'local' && typeof window !== 'undefined'
  const listeners = new Set<() => void>()
  let threads: ThreadMeta[] = load()
  let sorted: readonly ThreadMeta[] = sortThreads(threads)

  function load(): ThreadMeta[] {
    if (!local)
      return []
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? [] : JSON.parse(raw) as ThreadMeta[]
    }
    catch {
      return []
    }
  }

  function commit(next: ThreadMeta[]): void {
    threads = next
    sorted = sortThreads(next)
    if (local) {
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      }
      catch {
        // Quota or private mode: the in-memory copy still serves this page.
      }
    }
    listeners.forEach(l => l())
  }

  function get(id: string): ThreadMeta | undefined {
    return threads.find(t => t.id === id)
  }

  function touch(id: string, patch: Partial<Omit<ThreadMeta, 'id'>>): ThreadMeta {
    const now = Date.now()
    const existing = get(id)
    const next: ThreadMeta = existing
      ? { ...existing, ...patch, updatedAt: patch.updatedAt ?? now }
      : { id, title: '', createdAt: now, updatedAt: now, messageCount: 0, preview: '', archived: false, ...patch }
    commit(existing ? threads.map(t => (t.id === id ? next : t)) : [...threads, next])
    return next
  }

  return {
    list: () => sorted,
    get,
    create: init => touch(init?.id ?? newThreadId(), init ?? {}),
    touch,
    rename: (id, title) => {
      touch(id, { title })
    },
    archive: (id, archived) => {
      touch(id, { archived })
    },
    remove: (id) => {
      commit(threads.filter(t => t.id !== id))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      const onStorage = (event: StorageEvent): void => {
        if (local && event.key === key) {
          threads = load()
          sorted = sortThreads(threads)
          listener()
        }
      }
      if (local)
        window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(listener)
        if (local)
          window.removeEventListener('storage', onStorage)
      }
    },
  }
}

const EMPTY: readonly ThreadMeta[] = []

export function useThreadIndex(index: ThreadIndex): readonly ThreadMeta[] {
  return useSyncExternalStore(index.subscribe, index.list, () => EMPTY)
}

function textOf(message: UIMessage | undefined): string {
  return message?.parts.map(p => (p.type === 'text' ? p.content : '')).join(' ').trim() ?? ''
}

/** Title from the first user message; truncated with an ellipsis past `max` characters. */
export function threadTitleFrom(messages: readonly UIMessage[], max = 40): string {
  const text = textOf(messages.find(m => m.role === 'user')).replace(/\s+/g, ' ')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/**
 * Wrap a `ChatClientPersistence` so every write also updates the index:
 * message count, preview, timestamp, and a title derived from the first user
 * message unless one was set by hand.
 */
export function threadPersistence(index: ThreadIndex, base: ChatClientPersistence): ChatClientPersistence {
  return {
    getItem: id => base.getItem(id),
    setItem: async (id, state: ChatPersistedState | UIMessage[]) => {
      await base.setItem(id, Array.isArray(state) ? { messages: state } : state)
      const messages = Array.isArray(state) ? state : state.messages
      const last = messages.at(-1)
      const own = index.get(id)?.title
      index.touch(id, {
        messageCount: messages.length,
        preview: textOf(last).slice(0, 200),
        title: own !== undefined && own !== '' ? own : threadTitleFrom(messages),
      })
    },
    removeItem: async (id) => {
      await base.removeItem(id)
      index.remove(id)
    },
  }
}

export type ThreadDayLabel = 'today' | 'yesterday' | 'earlier'

export interface ThreadDayGroup {
  label: ThreadDayLabel
  threads: readonly ThreadMeta[]
}

const DAY = 24 * 60 * 60 * 1000

/** Buckets by local calendar day of `updatedAt`; empty buckets are omitted. */
export function groupThreadsByDay(threads: readonly ThreadMeta[], now = Date.now()): readonly ThreadDayGroup[] {
  const today = new Date(now).toDateString()
  const yesterday = new Date(now - DAY).toDateString()
  const buckets: Record<ThreadDayLabel, ThreadMeta[]> = { today: [], yesterday: [], earlier: [] }
  for (const t of threads) {
    const day = new Date(t.updatedAt).toDateString()
    buckets[day === today ? 'today' : day === yesterday ? 'yesterday' : 'earlier'].push(t)
  }
  return (['today', 'yesterday', 'earlier'] as const)
    .filter(label => buckets[label].length > 0)
    .map(label => ({ label, threads: buckets[label] }))
}
