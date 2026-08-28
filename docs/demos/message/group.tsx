import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from '@gedatou/cadenza-ui'

// Consecutive turns from one sender. Only the last row carries a real avatar;
// the earlier ones render an empty MessageAvatar so their text still lines up
// with it instead of shifting left.
export default function GroupDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <MessageGroup>
        <Message>
          <MessageAvatar />
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>Two cellists short for that week.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar />
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>Still nobody to cover.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <span className="text-xs font-medium">IN</span>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>So do we drop the Rite?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </div>
  )
}
