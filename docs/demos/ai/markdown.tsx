import type { ReactElement } from 'react'
import { Suggestions, SuggestionsItem, useChat } from '@gedatou/cadenza-ai'
import { respond, text } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { REPLIES } from './scripts'

// Proves the Markdown renderer: a GFM table, KaTeX math and a highlighted
// code block, each with its copy button — streamed character by character so
// the half-written table and code fence are repaired on every chunk. Both
// themes are read from the page.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(respond([
    [/table/i, [text(REPLIES.table)]],
    [/math/i, [text(REPLIES.math)]],
    [/code/i, [text(REPLIES.code)]],
  ], [text(REPLIES.plan)])))
  const chat = useChat({ fetcher })
  return (
    <ChatShell
      chat={chat}
      empty={(
        <Suggestions onValueChange={(value) => { void chat.sendMessage(value) }}>
          <SuggestionsItem value="Show a table">Show a table</SuggestionsItem>
          <SuggestionsItem value="Do the math">Do the math</SuggestionsItem>
          <SuggestionsItem value="Show code">Show code</SuggestionsItem>
        </Suggestions>
      )}
    />
  )
}

export default function MarkdownDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
