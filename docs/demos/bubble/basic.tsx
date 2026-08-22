import type { ReactElement } from 'react'
import { Bubble, BubbleContent } from '@gedatou/cadenza-ui'

// Bubble is the surface; BubbleContent is what carries the padding, the
// rounding and the colour. A bubble with no content part renders nothing
// visible — the variant styles the child, not the root.
export default function BasicDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      <Bubble variant="muted">
        <BubbleContent>Where does the interval go, if we make that change?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>After La Mer — it is the longest work of the evening.</BubbleContent>
      </Bubble>
    </div>
  )
}
