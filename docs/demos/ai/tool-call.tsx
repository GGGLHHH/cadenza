import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { scripted, sequence, tool } from '@gedatou/cadenza-ai/mock'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { getTime } from './tools'

// Proves the ToolCallCard states one after another: arguments arriving in
// slices (pending, spinner), then the result (complete, check). Press Send
// again and the second call fails — the error icon plus `tool-call-error`.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(sequence([
    [tool('get_time', { tz: 'Europe/Paris' }, { argsChunk: 6, output: { iso: '2026-10-14T19:30:00+02:00' } })],
    [tool('get_time', { tz: 'Mars/Olympus' }, { error: 'Unknown timezone' })],
  ])))
  const chat = useChat({ fetcher, tools: [getTime] })
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={chat.status !== 'ready'}
        onClick={() => void chat.sendMessage('What time is it there?')}
      >
        Send
      </Button>
      <ChatShell chat={chat} empty="Press Send twice: the first call succeeds, the second fails." />
    </div>
  )
}

export default function ToolCallDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
