import type { Script } from '@gedatou/cadenza-ai/mock'
import type { ReactElement } from 'react'
import { toolDefinition, useChat } from '@gedatou/cadenza-ai'
import { clientResultOf, text, tool } from '@gedatou/cadenza-ai/mock'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { z } from 'zod'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { getViewport } from './tools'

// Proves client tools: `get_viewport` carries a `.client()` executor, so the
// browser runs it and the result flows back on its own. `get_locale` has no
// executor — its card waits until the reader answers through
// `chat.addToolResult`, the manual path.

const getLocale = toolDefinition({
  name: 'get_locale',
  description: 'The reader’s language',
  inputSchema: z.object({}),
})

// Each ask pauses on a client tool; the resumed turn reads the result back.
const script: Script = (ctx) => {
  const viewport = clientResultOf(ctx, 'call-1')
  if (viewport !== undefined)
    return [text(`Your window is ${JSON.stringify(viewport)}.`)]
  const locale = clientResultOf(ctx, 'call-2')
  if (locale !== undefined)
    return [text(`Your locale is ${JSON.stringify(locale)}.`)]
  return /locale|language/i.test(ctx.lastUserText)
    ? [tool('get_locale', {}, { client: true, toolCallId: 'call-2' })]
    : [tool('get_viewport', {}, { client: true, toolCallId: 'call-1' })]
}

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(script))
  const chat = useChat({ fetcher, tools: [getViewport, getLocale] })
  const waiting = chat.messages
    .flatMap(message => message.parts)
    .some(part => part.type === 'tool-call' && part.name === 'get_locale' && part.state === 'input-complete')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={chat.status !== 'ready'}
          onClick={() => void chat.sendMessage('How big is my window?')}
        >
          Ask for the viewport
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={chat.status !== 'ready'}
          onClick={() => void chat.sendMessage('What is my locale?')}
        >
          Ask for the locale
        </Button>
        <Button
          size="sm"
          disabled={!waiting}
          onClick={() => void chat.addToolResult({ toolCallId: 'call-2', tool: 'get_locale', output: { locale: navigator.language } })}
        >
          Answer by hand
        </Button>
      </div>
      <ChatShell chat={chat} empty="The viewport answers itself; the locale waits for you." />
    </div>
  )
}

export default function ClientToolDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
