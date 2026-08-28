import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Message,
  MessageAvatar,
  MessageContent,
} from '@gedatou/cadenza-ui'

// The avatar anchors to the BOTTOM of the row, not the top — so it stays
// beside the last line of a long message rather than floating next to its
// first. align moves it to the other side along with everything else.
export default function AvatarDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Message>
        <MessageAvatar>
          <span className="text-xs font-medium">IN</span>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>
              Sectionals moved to three — the hall swapped us with the choir.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <span className="text-xs font-medium">TO</span>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>That clashes with the instrument delivery.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  )
}
