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
