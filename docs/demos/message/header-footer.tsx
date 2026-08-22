import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@gedatou/cadenza-ui'

// Header for who is speaking, footer for what happened to the message.
// Both carry an inset that lines them up with a padded bubble — and drop it
// automatically against a ghost one, so the text stays flush either way.
export default function HeaderFooterDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Message>
        <MessageContent>
          <MessageHeader>Ines</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I can sign for the timpani at three.</BubbleContent>
          </Bubble>
          <MessageFooter>18:42</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <Bubble>
            <BubbleContent>Perfect — I will start the sectional.</BubbleContent>
          </Bubble>
          <MessageFooter>Read</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  )
}
