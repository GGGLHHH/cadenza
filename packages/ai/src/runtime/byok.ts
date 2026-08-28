'use client'
import type { ByokClient } from '@tanstack/ai-client/byok'
import type { Catalog, Provider } from '../catalog/types'
import { defineByok, memoryStorage, passkeyStorage } from '@tanstack/ai-client/byok'
import { useEffect, useState } from 'react'

export interface CreateByokOptions {
  /** `true` keeps keys behind a passkey across reloads; default `false` = memory only. */
  persistent?: boolean
  /** Providers with `keyRequired: false` are marked server-covered up front. */
  catalog?: Catalog
}

function keylessCoverage(catalog: Catalog): Record<string, boolean> {
  return Object.fromEntries(catalog.providers.filter(p => !p.keyRequired).map(p => [p.id, true]))
}

/** A `ByokClient` with the house defaults, ready for `useChat({ byok })`. */
export function createByok(options: CreateByokOptions = {}): ByokClient {
  const byok = defineByok({ storage: options.persistent ? passkeyStorage() : memoryStorage() })
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
