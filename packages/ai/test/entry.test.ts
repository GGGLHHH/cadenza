import { describe, expect, it } from 'vitest'

describe('entry points', () => {
  // The root now carries the views, and with them streamdown / shiki / katex — a slow first import.
  it('re-exports the TanStack React surface and the byok helpers from the root', { timeout: 30_000 }, async () => {
    const root = await import('../src/index')
    expect(typeof root.useChat).toBe('function')
    expect(typeof root.fetchServerSentEvents).toBe('function')
    expect(typeof root.indexedDBPersistence).toBe('function')
    expect(typeof root.defineByok).toBe('function')
    expect(typeof root.memoryStorage).toBe('function')
    expect(typeof root.toolDefinition).toBe('function')
    expect(root.EventType.RUN_FINISHED).toBe('RUN_FINISHED')
    expect(typeof root.fromSpecTokenUsage).toBe('function')
  })

  it('re-exports the server surface from ./server', async () => {
    const server = await import('../src/server/index')
    expect(typeof server.chat).toBe('function')
    expect(typeof server.chatParamsFromRequest).toBe('function')
    expect(typeof server.toServerSentEventsResponse).toBe('function')
    expect(typeof server.getByokKey).toBe('function')
    expect(typeof server.byokMissing).toBe('function')
    expect(typeof server.defineByokProvider).toBe('function')
    expect(typeof server.maxIterations).toBe('function')
  })
})
