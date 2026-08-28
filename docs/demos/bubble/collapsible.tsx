import type { ReactElement } from 'react'
import {
  Bubble,
  BubbleContent,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Bubble ships no "show more" of its own — long content composes with
// Collapsible instead, which keeps the disclosure state and its keyboard
// contract in one place. The label has to follow that state: a trigger still
// reading "Show more" while aria-expanded is true is lying about what it does.
export default function CollapsibleDemo(): ReactElement {
  const [open, setOpen] = useState(false)

  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      <Bubble variant="muted">
        <BubbleContent>
          <Collapsible open={open} onOpenChange={setOpen}>
            <p>
              Ravel, Pavane pour une infante défunte — six minutes. Debussy,
              La Mer — twenty-four minutes.
            </p>
            <CollapsiblePanel>
              <p className="mbs-2">
                Interval — twenty minutes. Stravinsky, Firebird Suite —
                twenty-one minutes. Seventy-one minutes in total, and a curtain
                down comfortably before ten if you start on time.
              </p>
            </CollapsiblePanel>
            <CollapsibleTrigger className="
              mbs-2 text-xs font-medium underline underline-offset-2
            "
            >
              {open ? 'Show less' : 'Show more'}
            </CollapsibleTrigger>
          </Collapsible>
        </BubbleContent>
      </Bubble>
    </div>
  )
}
