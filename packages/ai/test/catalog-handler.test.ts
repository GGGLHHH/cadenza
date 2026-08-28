// @vitest-environment node
import type { ProviderPreset } from '../src/server/preset'
import { afterEach, describe, expect, it } from 'vitest'
import { createCatalogHandler } from '../src/server/catalog-handler'
import { definePreset } from '../src/server/preset'

function p(id: string, extra: Partial<ProviderPreset>): ProviderPreset {
  return definePreset({
    id,
    label: id,
    byok: { id, label: id, env: [`${id.toUpperCase()}_KEY`] },
    keyRequired: true,
    runtime: 'node',
    models: [],
    create: () => ({}) as never,
    thinking: () => ({}),
    ...extra,
  })
}

describe('createCatalogHandler', () => {
  afterEach(() => {
    delete process.env.A_KEY
    delete process.env.GOOGLE_CLOUD_PROJECT
  })

  it('reports coverage from env, keyless providers always covered, vertex needs key or project+location', async () => {
    process.env.A_KEY = 'x'
    delete process.env.B_KEY
    delete process.env.GOOGLE_VERTEX_API_KEY
    process.env.GOOGLE_CLOUD_PROJECT = 'proj'
    delete process.env.GOOGLE_CLOUD_LOCATION
    const { GET } = createCatalogHandler([p('a', {}), p('b', {}), p('c', { keyRequired: false }), p('vertex', { keyRequired: false })])
    const json = await (await GET(new Request('http://x/api/ai/catalog'))).json() as { coverage: Record<string, boolean>, providers: Array<Record<string, unknown>> }
    expect(json.coverage).toEqual({ a: true, b: false, c: true, vertex: false })
    expect(json.providers[0]).not.toHaveProperty('create')
    expect(json.providers[0]).not.toHaveProperty('thinking')
  })
})
