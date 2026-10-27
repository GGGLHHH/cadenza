import type { ReactElement } from 'react'
import { AnimateIcon, CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from '@gedatou/cadenza-icons'
import {
  Bubble,
  BubbleContent,
  Button,
  Message,
  MessageContent,
  MessageFooter,
} from '@gedatou/cadenza-ui'

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
            <AnimateIcon animateOnHover asChild>
              <Button aria-label="Copy" size="icon-xs" variant="ghost">
                <CopyIcon />
              </Button>
            </AnimateIcon>
            <AnimateIcon animateOnHover asChild>
              <Button aria-label="Regenerate" size="icon-xs" variant="ghost">
                <RefreshCwIcon />
              </Button>
            </AnimateIcon>
            <AnimateIcon animateOnHover asChild>
              <Button aria-label="Good response" size="icon-xs" variant="ghost">
                <ThumbsUpIcon />
              </Button>
            </AnimateIcon>
            <AnimateIcon animateOnHover asChild>
              <Button aria-label="Bad response" size="icon-xs" variant="ghost">
                <ThumbsDownIcon />
              </Button>
            </AnimateIcon>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  )
}
