import type { ReactElement } from 'react'
import type { ChatMessage } from './transcript'
import { Bubble, BubbleContent, Message, MessageContent } from '@gedatou/cadenza-ui'

// The real composition, not a hand-drawn box: Message owns the row and its
// alignment, Bubble owns the surface. The assistant turn is `ghost` — no
// background, no padding, free to run the full width — which is what makes a
// long reply read as prose rather than as a giant tinted block.
export function MessageRow({ message }: { message: ChatMessage }): ReactElement {
  const fromUser = message.role === 'user'

  return (
    <Message align={fromUser ? 'end' : 'start'}>
      <MessageContent>
        <Bubble variant={fromUser ? 'muted' : 'ghost'}>
          <BubbleContent>{message.content || '…'}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}
