import type { Step } from '@gedatou/cadenza-ai/mock'
import type { ReactElement } from 'react'
import { useChat, useUsageTracker } from '@gedatou/cadenza-ai'
import { custom, error, finish, reasoning, sequence, sleep, structured, text, tool, usage } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { getTime } from './tools'

// Proves the step DSL end to end: one turn plays every constructor in the
// order a real run would emit them — reasoning, a tool call with its result,
// text, a pause, a custom event, a structured object, usage, the finish
// reason — and the next turn ends in `error`, which the transcript reports.
// (`tool.result` continues an interrupted call, so it lives in the routing demo.)
const tour: Step[] = [
  reasoning('Every step constructor once, in the order a real run would emit them.'),
  tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
  text('**Text** streams word by word; '),
  sleep(600),
  text('`sleep` held this sentence back for 600 ms. A `custom` event and a `structured` object follow.'),
  custom('progress', { stage: 'summarising', percent: 80 }),
  structured({ programme: ['Pavane', 'La Mer', 'Firebird'], interval: { after: 'La Mer', minutes: 20 } }),
  usage({ inputTokens: 96, outputTokens: 48, reasoningTokens: 12 }),
  finish({ finishReason: 'stop' }),
]

function Body(): ReactElement {
  const tracker = useUsageTracker()
  const [events, setEvents] = useState<string[]>([])
  const [fetcher] = useState(() => mockFetcher(sequence([tour, [error('The scripted provider is over quota.', 'rate_limited')]])))
  const chat = useChat({
    fetcher,
    tools: [getTime],
    onChunk: tracker.onChunk,
    onFinish: tracker.onFinish,
    onCustomEvent: (name, value) => {
      // The structured step rides on custom events too; only list the demo's own.
      if (!name.startsWith('structured-output'))
        setEvents(list => [...list, `${name} ${JSON.stringify(value)}`])
    },
  })
  return (
    <div className="flex flex-col gap-2">
      <ChatShell chat={chat} empty="Send once for the tour, again for the error." />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        custom events:
        {' '}
        {events.length === 0 ? '—' : events.join('; ')}
        {' · usage: '}
        {tracker.lastRun === undefined ? '—' : `${tracker.lastRun.totalTokens} tokens`}
      </p>
    </div>
  )
}

export default function ScriptedBasicDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
