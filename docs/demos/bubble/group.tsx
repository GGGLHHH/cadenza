import type { ReactElement } from 'react'
import { Bubble, BubbleContent, BubbleGroup } from '@gedatou/cadenza-ui'

const LINES = [
  'Two cellists short for that week.',
  'Still nobody to cover.',
  'Do we drop the Rite?',
]

// The claim is "it tightens the spacing", which is invisible without a
// baseline — so the same three turns appear ungrouped above and grouped below.
export default function GroupDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-6 inline-full max-inline-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Ungrouped</span>
        <div className="flex flex-col gap-3">
          {LINES.map(line => (
            <Bubble align="end" key={line}>
              <BubbleContent>{line}</BubbleContent>
            </Bubble>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">BubbleGroup</span>
        <BubbleGroup>
          {LINES.map(line => (
            <Bubble align="end" key={line}>
              <BubbleContent>{line}</BubbleContent>
            </Bubble>
          ))}
        </BubbleGroup>
      </div>
    </div>
  )
}
