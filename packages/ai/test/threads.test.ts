import type { ChatClientPersistence } from '@tanstack/ai-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createThreadIndex, groupThreadsByDay, threadPersistence, threadTitleFrom } from '../src/runtime/threads'
import { createMemoryStorage } from './helpers/memory-storage'

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
})

describe('thread index', () => {
  it('lists newest first with archived last, and upserts on touch', () => {
    const index = createThreadIndex({ storage: 'memory' })
    const a = index.create({ id: 'a', title: 'A' })
    index.touch('b', { title: 'B' })
    index.touch('a', { messageCount: 3 })
    index.archive('b', true)
    expect(index.get('b')?.createdAt).toBeTypeOf('number')
    expect(index.list().map(t => t.id)).toEqual(['a', 'b'])
    expect(index.get('a')?.messageCount).toBe(3)
    expect(a.title).toBe('A')
  })

  it('keeps a stable list reference until the next write', () => {
    const index = createThreadIndex({ storage: 'memory' })
    index.create({ id: 'a' })
    const first = index.list()
    expect(index.list()).toBe(first)
    index.rename('a', 'Renamed')
    expect(index.list()).not.toBe(first)
  })

  it('notifies subscribers and persists to localStorage under the key', () => {
    const index = createThreadIndex({ storage: 'local', key: 'test:threads' })
    const listener = vi.fn()
    const off = index.subscribe(listener)
    index.create({ id: 'x', title: 'X' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('test:threads')!)).toHaveLength(1)
    off()
    index.remove('x')
    expect(listener).toHaveBeenCalledTimes(1)
    localStorage.removeItem('test:threads')
  })

  it('wraps a persistence adapter: setItem touches, removeItem removes, unknown ids get created', async () => {
    const index = createThreadIndex({ storage: 'memory' })
    const store = new Map<string, unknown>()
    const base: ChatClientPersistence = {
      getItem: id => (store.get(id) as never) ?? null,
      setItem: (id, state) => {
        store.set(id, state)
      },
      removeItem: (id) => {
        store.delete(id)
      },
    }
    const p = threadPersistence(index, base)
    await p.setItem('t1', { messages: [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'Where does the interval go?' }] }] } as never)
    expect(index.get('t1')?.title).toBe('Where does the interval go?')
    expect(index.get('t1')?.messageCount).toBe(1)
    expect(store.has('t1')).toBe(true)
    index.rename('t1', 'Custom')
    await p.setItem('t1', { messages: [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'Changed' }] }] } as never)
    expect(index.get('t1')?.title).toBe('Custom')
    await p.removeItem('t1')
    expect(index.get('t1')).toBeUndefined()
    expect(store.has('t1')).toBe(false)
  })

  it('leaves a tombstone: a write after remove does not resurrect the thread, create brings it back', async () => {
    const index = createThreadIndex({ storage: 'memory' })
    const store = new Map<string, unknown>()
    const base: ChatClientPersistence = {
      getItem: id => (store.get(id) as never) ?? null,
      setItem: (id, state) => {
        store.set(id, state)
      },
      removeItem: (id) => {
        store.delete(id)
      },
    }
    const p = threadPersistence(index, base)
    index.create({ id: 't1', title: 'One' })
    index.remove('t1')
    expect(index.wasRemoved('t1')).toBe(true)
    index.touch('t1', { messageCount: 2 })
    expect(index.get('t1')).toBeUndefined()
    await p.setItem('t1', { messages: [] } as never)
    expect(index.get('t1')).toBeUndefined()
    expect(store.has('t1')).toBe(false)
    expect(await p.getItem('t1')).toBeNull()
    index.create({ id: 't1', title: 'Again' })
    expect(index.wasRemoved('t1')).toBe(false)
    expect(index.get('t1')?.title).toBe('Again')
  })

  it('groups by day and derives titles', () => {
    const now = new Date(2026, 7, 28, 12).getTime()
    const day = 24 * 60 * 60 * 1000
    const meta = (id: string, updatedAt: number) => ({ id, title: id, createdAt: now, updatedAt, messageCount: 0, preview: '', archived: false })
    const threads = [meta('1', now - 1000), meta('2', now - day), meta('3', now - 5 * day)]
    expect(groupThreadsByDay(threads, now).map(g => [g.label, g.threads.length])).toEqual([['today', 1], ['yesterday', 1], ['earlier', 1]])
    expect(groupThreadsByDay([meta('1', now)], now).map(g => g.label)).toEqual(['today'])
    expect(threadTitleFrom([{ id: 'u', role: 'user', parts: [{ type: 'text', content: 'x'.repeat(100) }] }] as never, 40)).toHaveLength(41)
    expect(threadTitleFrom([] as never)).toBe('')
  })
})
