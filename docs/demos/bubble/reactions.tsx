import type { ReactElement } from 'react'
import { Bubble, BubbleContent, BubbleReactions, Button } from '@gedatou/cadenza-ui'
import { IconCornerUpLeft, IconMoodSmile } from '@tabler/icons-react'

// Reactions overlap the bubble's edge by design, so rows need vertical room
// between them — hence the larger gap. side picks the edge, align the corner.
// The strip takes buttons as readily as emoji: the second bubble is a quick
// action row rather than a reaction count.
export default function ReactionsDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-8 inline-full max-inline-sm">
      <Bubble variant="muted">
        <BubbleContent>Printed and sent to front of house.</BubbleContent>
        <BubbleReactions>
          <span aria-label="two people reacted with a thumbs up" role="img">👍 2</span>
        </BubbleReactions>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Curtain down before ten.</BubbleContent>
        <BubbleReactions align="start" side="top">
          <Button aria-label="React to this message" size="icon-xs" variant="ghost">
            <IconMoodSmile />
          </Button>
          <Button aria-label="Reply to this message" size="icon-xs" variant="ghost">
            <IconCornerUpLeft />
          </Button>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
