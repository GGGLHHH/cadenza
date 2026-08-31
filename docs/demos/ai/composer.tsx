import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { echo } from '@gedatou/cadenza-ai/mock'
import { Kbd } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves the composer's keyboard contract: the textarea grows with the draft,
// Enter sends, Shift+Enter breaks a line, an IME composition is left alone,
// and the submit button turns into stop while the reply streams. The echo
// streams character by character so there is time to press stop.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(echo()))
  const chat = useChat({ fetcher })
  return (
    <ChatShell
      chat={chat}
      empty="Type a few lines; the reply repeats them."
      toolbar={(
        <span className="text-xs text-muted-foreground">
          <Kbd>Shift</Kbd>
          +
          <Kbd>↵</Kbd>
          {' '}
          newline
        </span>
      )}
    />
  )
}

export default function ComposerDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
