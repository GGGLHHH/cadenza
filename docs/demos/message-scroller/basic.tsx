import type { ReactElement } from 'react'
import {
  Button,
  Input,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { MessageRow } from './message-row'
import { useFakeChat } from './transcript'

// The whole family in one place: send a message and it anchors near the top
// of the viewport, the reply streams into the room below it, and the jump
// button appears the moment you scroll away from the live edge
function BasicChat(): ReactElement {
  const { messages, send } = useFakeChat()
  const [draft, setDraft] = useState('')

  return (
    <form
      className="flex flex-col gap-3 block-96"
      onSubmit={(event) => {
        event.preventDefault()
        if (draft.trim() === '')
          return
        send(draft.trim())
        setDraft('')
      }}
    >
      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {messages.map(message => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === 'user'}
                >
                  <MessageRow message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="flex gap-2">
        <Input
          aria-label="Message"
          placeholder="Ask about the programme…"
          value={draft}
          onValueChange={setDraft}
        />
        <Button type="submit">Send</Button>
      </div>
    </form>
  )
}

export default function BasicDemo(): ReactElement {
  return (
    <ResettableDemo>
      <BasicChat />
    </ResettableDemo>
  )
}
