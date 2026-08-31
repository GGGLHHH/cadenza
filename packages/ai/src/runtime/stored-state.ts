'use client'
import { useCallback, useSyncExternalStore } from 'react'

/** `detached`: this page could not persist, so the cache outranks whatever the store still holds. */
interface Entry { raw: string | null, value: unknown, detached?: boolean }

const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, Entry>()

function storage(): Storage | undefined {
  try {
    // Accessing `localStorage` itself throws in some sandboxes (opaque origins, blocked site data).
    return typeof window === 'undefined' ? undefined : window.localStorage ?? undefined
  }
  catch {
    return undefined
  }
}

function snapshot<T>(key: string, initial: T): T {
  const store = storage()
  const hit = cache.get(key)
  // No storage, or a write this page could not persist: the cache is the only
  // state there is. Without the `detached` half, a rejected write would read
  // back the stale string still in the store and silently revert itself.
  if (!store || hit?.detached)
    return hit ? hit.value as T : seed(key, null, initial)
  const raw = store.getItem(key)
  if (hit && hit.raw === raw)
    return hit.value as T
  if (raw === null)
    return seed(key, null, initial)
  try {
    return seed(key, raw, JSON.parse(raw) as T)
  }
  catch {
    return seed(key, raw, initial)
  }
}

function seed<T>(key: string, raw: string | null, value: T): T {
  cache.set(key, { raw, value })
  return value
}

function emit(key: string): void {
  listeners.get(key)?.forEach(l => l())
}

/**
 * `useState` whose value round-trips through `localStorage[key]` and stays in
 * sync across hooks and tabs. Falls back to `initial` on the server and to an
 * in-memory copy where storage is unavailable; writes never throw.
 */
export function useStoredState<T>(key: string, initial: T): [T, (next: T) => void] {
  const subscribe = useCallback((listener: () => void): (() => void) => {
    let set = listeners.get(key)
    if (!set) {
      set = new Set()
      listeners.set(key, set)
    }
    set.add(listener)
    const onStorage = (event: StorageEvent): void => {
      if (event.key === key)
        listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      set.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }, [key])
  const value = useSyncExternalStore(subscribe, () => snapshot(key, initial), () => initial)
  const setValue = useCallback((next: T): void => {
    const raw = JSON.stringify(next)
    let stored: string | null = null
    let detached = false
    try {
      storage()?.setItem(key, raw)
      stored = storage()?.getItem(key) ?? null
    }
    catch {
      // Quota or private mode: the in-memory copy serves this page from here on,
      // which `snapshot` honours through `detached`.
      detached = true
    }
    cache.set(key, { raw: stored, value: next, detached })
    emit(key)
  }, [key])
  return [value, setValue]
}
