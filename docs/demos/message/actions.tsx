import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Button,
  Message,
  MessageContent,
  MessageFooter,
} from '@gedatou/cadenza-ui'
import { IconCopy, IconRefresh, IconThumbDown, IconThumbUp } from '@tabler/icons-react'

// Message-level actions live in the footer: copy, retry, feedback. They are
// icon-only, so every one needs an aria-label — the icon is decorative and
// carries no name of its own.
export default function ActionsDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Message>
        <MessageContent>
          <Bubble variant="ghost">
            <BubbleContent>
              Ravel, Pavane — six minutes. Debussy, La Mer — twenty-four.
              Interval — twenty. Stravinsky, Firebird Suite — twenty-one.
            </BubbleContent>
          </Bubble>
          <MessageFooter className="gap-0.5">
            <Button aria-label="Copy" size="icon-xs" variant="ghost">
              <IconCopy />
            </Button>
            <Button aria-label="Regenerate" size="icon-xs" variant="ghost">
              <IconRefresh />
            </Button>
            <Button aria-label="Good response" size="icon-xs" variant="ghost">
              <IconThumbUp />
            </Button>
            <Button aria-label="Bad response" size="icon-xs" variant="ghost">
              <IconThumbDown />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  )
}
