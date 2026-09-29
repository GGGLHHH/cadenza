import type { ToolRendererProps } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { definePartRenderers, parsePartialJSON, PartRenderersProvider, toolInput, useChat } from '@gedatou/cadenza-ai'
import { text, tool } from '@gedatou/cadenza-ai/mock'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@gedatou/cadenza-ui'
import { IconClock } from '@tabler/icons-react'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { getTime } from './tools'

// Proves the renderer registry: `get_time` gets a custom card keyed by tool
// name while `lookup_hall` falls back to the default ToolCallCard; the custom
// card reads its arguments through `toolInput`, so it copes with arguments
// that are still streaming; and because it owns its card it lays out flat
// instead of folding with its neighbour into "Ran 2 tools".

// The result arrives as JSON text; `toolInput` covers the arguments, this the output.
function outputField(value: unknown, key: string): string | undefined {
  const data: unknown = typeof value === 'string' ? parsePartialJSON(value) : value
  const found = typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined
  return typeof found === 'string' ? found : undefined
}

function TimeCard({ part, result, streaming }: ToolRendererProps): ReactElement {
  const { tz } = toolInput<{ tz: string }>(part)
  const iso = outputField(part.output ?? result?.content, 'iso')
  return (
    <Item variant="outline" data-streaming={streaming ? '' : undefined}>
      <ItemMedia variant="icon">
        <IconClock />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{tz ?? 'Somewhere…'}</ItemTitle>
        <ItemDescription className={iso === undefined ? 'shimmer' : undefined}>
          {iso ?? 'Looking up the time…'}
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

const renderers = definePartRenderers({
  toolCall: { get_time: props => <TimeCard {...props} /> },
})

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(() => [
    tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
    tool('lookup_hall', { city: 'Paris' }, { output: { hall: 'Philharmonie de Paris', seats: 2400 } }),
    text('Downbeat at 19:30 at the Philharmonie.'),
  ]))
  const chat = useChat({ fetcher, tools: [getTime] })
  return (
    <PartRenderersProvider renderers={renderers}>
      <ChatShell chat={chat} empty="Ask when and where the concert is." />
    </PartRenderersProvider>
  )
}

export default function ToolRenderersDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
