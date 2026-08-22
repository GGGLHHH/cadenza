import type { ReactElement } from 'react'
import { Bubble, BubbleContent, Message, MessageContent } from '@gedatou/cadenza-ui'

// Message is the row, Bubble is the surface. align is the whole alignment
// story — it flips the row and pulls everything inside to the same side.
export default function BasicDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Message>
        <MessageContent>
          <Bubble variant="ghost">
            <BubbleContent>
              La Mer is the natural substitute: twenty-four minutes, and it asks
              far less of the low strings.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Where does the interval go?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  )
}
