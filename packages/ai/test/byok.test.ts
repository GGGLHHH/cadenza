import { describe, expect, it } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { createByok } from '../src/runtime/byok'

describe('createByok', () => {
  it('marks keyless providers as server-covered so prepare() does not block', async () => {
    const byok = createByok({ persistent: false, catalog: defaultCatalog })
    await byok.ready()
    await expect(byok.prepare('vertex')).resolves.toBeUndefined()
    await expect(byok.prepare('openai')).rejects.toThrow()
  })
})

describe('createByok storage', () => {
  it('persistent: true takes the default (passkey) storage, which falls back to memory with a warning where WebAuthn is missing', async () => {
    const byok = createByok({ persistent: true })
    await byok.ready()
    expect(byok.storage.persistent).toBe(false)
    expect(byok.storage.warning).toContain('memory')
  })

  it('an explicit storage wins over persistent', () => {
    const storage = { id: 'test', label: 'Test store', persistent: true, load: () => ({}), save: () => {}, clear: () => {} }
    expect(createByok({ persistent: false, storage }).storage.label).toBe('Test store')
  })
})
