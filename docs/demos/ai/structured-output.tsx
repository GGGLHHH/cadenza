import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { structured } from '@gedatou/cadenza-ai/mock'
import { Badge } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { z } from 'zod'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves `useChat({ outputSchema })`: the reply streams JSON six characters at
// a time, `chat.partial` fills in row by row above the shell and snaps to
// `chat.final` once the object is complete; in the transcript the same part
// goes `data-streaming` → `data-complete`.
const schema = z.object({ works: z.array(z.object({ title: z.string(), minutes: z.number() })) })

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(() => [
    structured({ works: [{ title: 'Pavane', minutes: 6 }, { title: 'La Mer', minutes: 24 }, { title: 'Firebird', minutes: 21 }] }, { chunk: 6 }),
  ]))
  const chat = useChat({ fetcher, outputSchema: schema })
  const works = chat.final?.works ?? chat.partial.works ?? []
  return (
    <div className="flex flex-col gap-2">
      <div
        aria-live="polite"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Badge variant={chat.final === null ? 'outline' : 'secondary'}>{chat.final === null ? 'partial' : 'final'}</Badge>
        {works.map((work, index) => (
          // Partial rows arrive without their fields yet; the index is the only stable key.
          // eslint-disable-next-line react/no-array-index-key
          <span key={index}>
            {work?.title ?? '…'}
            {work?.minutes !== undefined && ` ${work.minutes} min`}
          </span>
        ))}
      </div>
      <ChatShell chat={chat} empty="Ask for the programme as data." />
    </div>
  )
}

export default function StructuredOutputDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
