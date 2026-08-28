import type { ReactElement } from 'react'
import { Suggestions, SuggestionsItem, useChat } from '@gedatou/cadenza-ai'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves a chip is a send: pressing one hands its `value` to the root's
// `onValueChange`, which sends it as the user message — no draft involved.
// The chips live in the transcript's empty slot, so they leave with it.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime] })
  return (
    <ChatShell
      chat={chat}
      empty={(
        <Suggestions
          onValueChange={(value) => {
            void chat.sendMessage(value)
          }}
        >
          <SuggestionsItem value="Plan the programme">Plan the programme</SuggestionsItem>
          <SuggestionsItem value="Show the programme as a table">Show it as a table</SuggestionsItem>
          <SuggestionsItem value="How many minutes of music?">How many minutes?</SuggestionsItem>
          <SuggestionsItem value="Give me the running order as code">As code</SuggestionsItem>
        </Suggestions>
      )}
    />
  )
}

export default function SuggestionsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
