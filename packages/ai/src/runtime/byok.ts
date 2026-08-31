'use client'
import type { ByokClient, KeyringStorage } from '@tanstack/ai-client/byok'
import type { Catalog, Provider } from '../catalog/types'
import { defaultByokStorage, defineByok, memoryStorage } from '@tanstack/ai-client/byok'
import { useEffect, useState } from 'react'

export interface CreateByokOptions {
  /**
   * `true` keeps the keyring across reloads, encrypted behind a passkey
   * (`defaultByokStorage`: WebAuthn PRF → AES-256-GCM in IndexedDB); where the
   * browser cannot do that it falls back to this tab's memory and says so in
   * `byok.storage.warning`. Default `false` = memory only.
   */
  persistent?: boolean
  /** Your own `KeyringStorage`; wins over `persistent`. */
  storage?: KeyringStorage
  /** Providers with `keyRequired: false` are marked server-covered up front. */
  catalog?: Catalog
}

function keylessCoverage(catalog: Catalog): Record<string, boolean> {
  return Object.fromEntries(catalog.providers.filter(p => !p.keyRequired).map(p => [p.id, true]))
}

const BYOK_ERRORS = new Set(['ByokBlockedError', 'ByokMissingError', 'ByokUnresolvedProviderError'])

/** True for the errors a send throws when the client could not attach a key — the dialog is already asking; the send can run again once the key is in. */
export function isByokError(error: unknown): boolean {
  return error instanceof Error && BYOK_ERRORS.has(error.name)
}

/** A `ByokClient` with the house defaults, ready for `useChat({ byok })`. */
export function createByok(options: CreateByokOptions = {}): ByokClient {
  const byok = defineByok({ storage: options.storage ?? (options.persistent ? defaultByokStorage() : memoryStorage()) })
  if (options.catalog)
    byok.setServerCoverage(keylessCoverage(options.catalog))
  return byok
}

export interface ServerCoverage {
  coverage: Record<string, boolean> | undefined
  providers: readonly Provider[] | undefined
  error: Error | undefined
}

interface CatalogResponse {
  providers: Provider[]
  coverage: Record<string, boolean>
}

/**
 * Fetch `/api/ai/catalog` once and merge its `coverage` into the client, so
 * `prepare()` stops asking for keys the server already holds.
 */
export function useServerCoverage(byok: ByokClient, url = '/api/ai/catalog'): ServerCoverage {
  const [state, setState] = useState<ServerCoverage>({ coverage: undefined, providers: undefined, error: undefined })
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`cadenza-ai: ${url} answered ${res.status}`)
        return res.json() as Promise<CatalogResponse>
      })
      .then((json) => {
        if (cancelled)
          return
        byok.setServerCoverage(json.coverage)
        setState({ coverage: json.coverage, providers: json.providers, error: undefined })
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState(s => ({ ...s, error: error instanceof Error ? error : new Error(String(error)) }))
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [byok, url])
  return state
}
