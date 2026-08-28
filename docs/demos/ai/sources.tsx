import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { text, tool } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves `sourcesOf` + `Sources`: a provider-executed `web_search` carries its
// hits in `part.output`, and the default rendering collects them into a
// folded list at the end of the message (`data-count="2"`).
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(() => [
    tool('web_search', { q: 'Philharmonie de Paris capacity' }, {
      providerExecuted: true,
      output: [
        { url: 'https://philharmoniedeparis.fr', title: 'Philharmonie de Paris' },
        { url: 'https://en.wikipedia.org/wiki/Philharmonie_de_Paris', title: 'Wikipedia' },
      ],
    }),
    text('2,400 seats in the Grande salle Pierre Boulez.'),
  ]))
  const chat = useChat({ fetcher })
  return <ChatShell chat={chat} empty="Ask how many seats the Philharmonie has." />
}

export default function SourcesDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
