import type { PartLabels, ToolRendererProps } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { definePartRenderers, parsePartialJSON, PartRenderersProvider, useChat } from '@gedatou/cadenza-ai'
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
// card copes with arguments that are still streaming; and `labels` renames
// the group trigger the two consecutive calls fold into.

// Failure is expected while the arguments are still streaming: fall back to the raw text.
function parse(value: unknown): unknown {
  if (typeof value !== 'string')
    return value
  try {
    return parsePartialJSON(value) ?? value
  }
  catch {
    return value
  }
}

function field(value: unknown, key: string): string | undefined {
  const found = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined
  return typeof found === 'string' ? found : undefined
}

function TimeCard({ part, result, streaming }: ToolRendererProps): ReactElement {
  const tz = field(part.input ?? parse(part.arguments), 'tz')
  const iso = field(part.output ?? parse(result?.content), 'iso')
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

const labels: Partial<PartLabels> = {
  toolGroup: count => `${count} tool calls`,
}

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(() => [
    tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
    tool('lookup_hall', { city: 'Paris' }, { output: { hall: 'Philharmonie de Paris', seats: 2400 } }),
    text('Downbeat at 19:30 at the Philharmonie.'),
  ]))
  const chat = useChat({ fetcher, tools: [getTime] })
  return (
    <PartRenderersProvider renderers={renderers} labels={labels}>
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
