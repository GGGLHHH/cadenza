import type { ReactElement } from 'react'
import { Suggestions, SuggestionsItem, useChat } from '@gedatou/cadenza-ai'
import { error, scripted, sequence } from '@gedatou/cadenza-ai/mock'
import { Button, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves every run state has a face: the empty transcript offers suggestions,
// `submitted` shows the pending marker, the first turn fails with a 429
// (`TranscriptError` carries `data-code`) and Retry replays it through
// `chat.reload()`, and stopping a long stream ends in `ready`, not an error.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(sequence([[error('Rate limited', '429')], rehearsalScript()])))
  const chat = useChat({ fetcher, tools: [getTime] })
  const send = (value: string): void => {
    void chat.sendMessage(value)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">
          status:
          {' '}
          {chat.status}
        </p>
        {chat.error !== undefined && (
          <Button size="xs" variant="outline" className="ms-auto" onClick={() => void chat.reload()}>
            Retry
          </Button>
        )}
      </div>
      <ChatShell
        chat={chat}
        empty={(
          <>
            <EmptyHeader>
              <EmptyTitle>Nothing planned yet</EmptyTitle>
              <EmptyDescription>The first reply is rate limited on purpose — retry it.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Suggestions onValueChange={send}>
                <SuggestionsItem value="Plan the programme">Plan the programme</SuggestionsItem>
                <SuggestionsItem value="Tell me something long">Tell me something long</SuggestionsItem>
              </Suggestions>
            </EmptyContent>
          </>
        )}
      />
    </div>
  )
}

export default function StatesDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
