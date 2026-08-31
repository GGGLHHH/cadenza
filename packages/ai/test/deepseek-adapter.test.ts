// @vitest-environment node
import type { AnyTool, TextOptions } from '@tanstack/ai'
import { describe, expect, it } from 'vitest'
import { deepseek, deepseekWebSearch } from '../src/providers/deepseek'

// `mapOptionsToRequest` is protected on the class; the test reaches it structurally.
interface Mapper {
  mapOptionsToRequest: (options: TextOptions) => Record<string, unknown>
}

const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as Mapper

const getTime: AnyTool = { name: 'get_time', description: 'Current time', inputSchema: { type: 'object', properties: { tz: { type: 'string' } }, required: ['tz'] } }

function request(tools?: AnyTool[]): Record<string, unknown> {
  return adapter.mapOptionsToRequest({ model: 'deepseek-v4-flash', messages: [{ role: 'user', content: 'hi' }], tools } as unknown as TextOptions)
}

describe('deepSeekResponsesAdapter', () => {
  it('sends the built-in search as a provider tool, not as a function the server would have to run', () => {
    expect(request([deepseekWebSearch()]).tools).toEqual([{ type: 'web_search' }])
  })

  it('still sends an ordinary tool as a function', () => {
    expect(request([getTime]).tools).toMatchObject([{ type: 'function', name: 'get_time' }])
  })

  it('mixes both in one request, and omits the key when there are none', () => {
    expect(request([getTime, deepseekWebSearch()]).tools).toMatchObject([{ type: 'function', name: 'get_time' }, { type: 'web_search' }])
    expect(request([])).not.toHaveProperty('tools')
    expect(request()).not.toHaveProperty('tools')
  })

  it('the preset builds the DeepSeek adapter and keeps the compatible discovery', () => {
    const built = deepseek.create('deepseek-v4-flash', 'sk-x')
    expect(built.name).toBe('deepseek')
    expect(built.model).toBe('deepseek-v4-flash')
    expect(typeof deepseek.discoverModels).toBe('function')
  })
})
