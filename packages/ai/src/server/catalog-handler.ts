import type { Provider } from '../catalog/types'
import type { ProviderPreset } from './preset'
import { getByokKey } from '@tanstack/ai/byok/server'
import { ollamaHostAllowed } from './ollama-host'

function hasEnv(...names: string[]): boolean {
  return names.some((n) => {
    const v = process.env[n]
    return v !== undefined && v !== ''
  })
}

/** Whether the server can run this provider without a browser-supplied key. */
function covered(p: ProviderPreset): boolean {
  if (!p.keyRequired) {
    if (p.id !== 'vertex')
      return true
    // Vertex: an explicit API key, or ADC with a project + location.
    return hasEnv('GOOGLE_VERTEX_API_KEY') || (hasEnv('GOOGLE_CLOUD_PROJECT', 'GOOGLE_VERTEX_PROJECT') && hasEnv('GOOGLE_CLOUD_LOCATION', 'GOOGLE_VERTEX_LOCATION'))
  }
  return hasEnv(...(p.byok?.env ?? []))
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/**
 * `GET /api/ai/catalog`: the pure-data side of each preset plus a coverage map
 * the browser feeds into `byok.setServerCoverage()`.
 * `GET ?refresh=1&provider=<id>`: `preset.discoverModels(key)` with the same
 * header-then-env key the chat handler would use → `{ provider, models }`.
 */
export interface CatalogHandlerOptions {
  /**
   * Hosts an `x-byok-ollama` header may point at; default: loopback and RFC 1918
   * ranges. Same option and same meaning as on `createChatHandler` — set both,
   * because `?refresh=1&provider=ollama` fetches that host too.
   */
  ollamaHosts?: readonly string[]
}

export function createCatalogHandler(presets: readonly ProviderPreset[], options: CatalogHandlerOptions = {}): { GET: (request: Request) => Promise<Response> } {
  return {
    GET: async (request: Request): Promise<Response> => {
      const url = new URL(request.url)
      if (url.searchParams.get('refresh') === '1') {
        const id = url.searchParams.get('provider')
        const preset = presets.find(p => p.id === id)
        if (!preset)
          return json(400, { error: { type: 'unknown_provider' } })
        if (!preset.discoverModels)
          return json(400, { error: { type: 'discover_unsupported', provider: preset.id } })
        const key = preset.byok ? getByokKey(request, preset.byok) : null
        // `x-byok-ollama` is a host URL this request is about to fetch, not a
        // key. Unchecked it is a server-side request forgery: any caller could
        // point `discoverModels` at the cloud metadata endpoint or an internal
        // service. The chat handler checks the same header for the same reason.
        if (preset.id === 'ollama' && key !== null && !ollamaHostAllowed(key, options.ollamaHosts))
          return json(400, { error: { type: 'host_not_allowed', provider: preset.id } })
        try {
          return Response.json({ provider: preset.id, models: await preset.discoverModels(key) })
        }
        catch {
          // The upstream message may echo the host / key; only the type leaves the server.
          return json(502, { error: { type: 'discover_failed', provider: preset.id } })
        }
      }
      const providers: Provider[] = presets.map(({ create: _c, thinking: _t, discoverModels: _d, ...rest }) => rest)
      const coverage = Object.fromEntries(presets.map(p => [p.id, covered(p)]))
      return Response.json({ providers, coverage, generatedAt: new Date().toISOString() })
    },
  }
}
