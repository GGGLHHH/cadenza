import type { ReactElement } from 'react'
import { Bubble, BubbleContent } from '@gedatou/cadenza-ui'

// align pins the bubble to one side of its container. In a real transcript
// you set it on Message instead — the bubble reads the message's data-align
// through a group selector, so it follows without being told twice.
export default function AlignmentDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      <Bubble align="start" variant="muted">
        <BubbleContent>align=&quot;start&quot;</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>align=&quot;end&quot;</BubbleContent>
      </Bubble>
    </div>
  )
}
