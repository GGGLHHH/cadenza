// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { definePreset } from '../src/server/preset'
import { pickSelection } from '../src/server/selection'

const fake = definePreset({
  id: 'fake',
  label: 'Fake',
  byok: null,
  keyRequired: false,
  runtime: 'node',
  models: [{ id: 'm1', name: 'm1', provider: 'fake', input: ['text'], reasoning: true }],
  create: () => {
    throw new Error('not used')
  },
  thinking: () => ({}),
})

function ok(sel: ReturnType<typeof pickSelection>): Exclude<ReturnType<typeof pickSelection>, Response> {
  if (sel instanceof Response)
    throw new Error(`unexpected ${sel.status}`)
  return sel
}

describe('pickSelection', () => {
  it('reads only provider / model / thinking', () => {
    const sel = ok(pickSelection({ provider: 'fake', model: 'm1', thinking: 'high', modelOptions: { tools: [] }, systemPrompts: ['x'] }, [fake], {}))
    expect(sel.model.id).toBe('m1')
    expect(sel.thinking).toBe('high')
  })
  it('falls back to defaultModel when provider/model are absent', () => {
    expect(ok(pickSelection({}, [fake], { defaultModel: 'fake/m1' })).model.id).toBe('m1')
  })
  it('rejects unknown provider, unknown model, injection-shaped ids', () => {
    expect(pickSelection({ provider: '../x', model: 'm1' }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({ provider: 'fake', model: 'nope' }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({ provider: 'fake', model: 'x'.repeat(201) }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({}, [fake], {})).toBeInstanceOf(Response)
  })
  it('lets a preset with discoverModels accept ids outside the catalog', () => {
    const open = definePreset({ ...fake, id: 'open', discoverModels: async () => [] })
    expect(ok(pickSelection({ provider: 'open', model: 'anything:latest' }, [open], {})).model.id).toBe('anything:latest')
  })
  it('normalises an unknown thinking level to off', () => {
    expect(ok(pickSelection({ provider: 'fake', model: 'm1', thinking: 'ultra' }, [fake], {})).thinking).toBe('off')
  })
})
