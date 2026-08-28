import type { ReactElement } from 'react'
import type { ChatMessage } from './transcript'
import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { MessageRow } from './message-row'
import { ResettableDemo } from './resettable'
import { useFakeChat } from './transcript'

// scrollAnchor is what the viewport lifts to the top when a new turn
// arrives — and it is not tied to a role. The bar down the left marks the
// anchored rows (read off the component's own data-scroll-anchor), so
// switching modes moves the marks before you send anything. Then send with
// each setting: anchoring the question keeps it readable while the answer
// grows below it; anchoring the reply lifts the answer instead and pushes
// the question off the top, with nothing left below to fill the viewport
function AnchoringBody(): ReactElement {
  const [anchorRole, setAnchorRole] = useState<ChatMessage['role']>('user')
  const { messages, sendNext } = useFakeChat()

  return (
    <div className="flex flex-col gap-3 block-96">
      <div className="flex flex-wrap gap-2">
        <Button
          aria-pressed={anchorRole === 'user'}
          size="sm"
          variant={anchorRole === 'user' ? 'default' : 'outline'}
          onClick={() => setAnchorRole('user')}
        >
          Anchor questions
        </Button>
        <Button
          aria-pressed={anchorRole === 'assistant'}
          size="sm"
          variant={anchorRole === 'assistant' ? 'default' : 'outline'}
          onClick={() => setAnchorRole('assistant')}
        >
          Anchor replies
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={sendNext}
        >
          Send a message
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {anchorRole === 'user'
          ? 'Marked rows start a turn. The question stays at the top; the answer grows below it.'
          : 'Marked rows start a turn. The reply is lifted to the top, pushing the question out of view.'}
      </p>
      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {messages.map(message => (
                <MessageScrollerItem
                  className="
                    border-s-2 border-transparent ps-3
                    data-[scroll-anchor=true]:border-primary
                  "
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === anchorRole}
                >
                  <MessageRow message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  )
}

export default function AnchoringDemo(): ReactElement {
  return (
    <ResettableDemo>
      <AnchoringBody />
    </ResettableDemo>
  )
}
