import { toolDefinition } from '@gedatou/cadenza-ai'
import { z } from 'zod'

// Client-side declarations only: the scripted transport plays the server, so
// nothing here executes — except `getViewport`, which runs in the browser.

export const getTime = toolDefinition({
  name: 'get_time',
  description: 'Current time in a timezone',
  inputSchema: z.object({ tz: z.string() }),
})

// The same permissive schema the scripted transport hashes, so the client
// binds the approval interrupt to this definition.
export const move = toolDefinition({
  name: 'move',
  description: 'Move a work in the running order',
  inputSchema: { type: 'object', additionalProperties: true },
  needsApproval: true,
})

export const getViewport = toolDefinition({
  name: 'get_viewport',
  description: 'Size of the reader’s window',
  inputSchema: z.object({}),
}).client(() => ({ width: window.innerWidth, height: window.innerHeight }))
