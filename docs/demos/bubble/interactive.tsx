import type { ReactElement } from 'react'
import { Bubble, BubbleContent } from '@gedatou/cadenza-ui'

// render turns the content into a real button or anchor — the variants
// already carry :hover and focus-ring rules for both, so a pressable bubble
// needs no extra styling, just the right element.
export default function InteractiveDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      <Bubble variant="outline">
        <BubbleContent render={<button type="button" />}>
          Add La Mer to the programme
        </BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent render={<a href="#interactive" />}>
          Open the running order
        </BubbleContent>
      </Bubble>
    </div>
  )
}
