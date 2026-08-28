import type { Provider } from '../catalog/types'
import type { ProviderPreset } from './preset'

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

/**
 * `GET /api/ai/catalog`: the pure-data side of each preset plus a coverage map
 * the browser feeds into `byok.setServerCoverage()`.
 */
export function createCatalogHandler(presets: readonly ProviderPreset[]): { GET: (request: Request) => Promise<Response> } {
  return {
    GET: async (_request: Request): Promise<Response> => {
      const providers: Provider[] = presets.map(({ create: _c, thinking: _t, discoverModels: _d, ...rest }) => rest)
      const coverage = Object.fromEntries(presets.map(p => [p.id, covered(p)]))
      return Response.json({ providers, coverage, generatedAt: new Date().toISOString() })
    },
  }
}
