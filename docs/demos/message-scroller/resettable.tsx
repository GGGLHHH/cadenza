import type { ReactElement, ReactNode } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { IconRefresh } from '@tabler/icons-react'
import { Fragment, useState } from 'react'

// Demo-only scaffolding. Every scroller demo accumulates state you cannot
// undo from the UI — messages sent, history loaded, the reader's own scroll
// position — and the only way back would be reloading the page, which resets
// the other ten demos with it. Bumping the key remounts just this one, so
// every piece of state inside it starts over.
export function ResettableDemo({
  children,
  className = 'max-inline-sm',
}: {
  children: ReactNode
  className?: string
}): ReactElement {
  const [generation, setGeneration] = useState(0)

  return (
    <div className={`
      mx-auto flex flex-col gap-2 inline-full
      ${className}
    `}
    >
      <div className="flex justify-end">
        <Button
          aria-label="Reset demo"
          size="icon-sm"
          variant="ghost"
          onClick={() => setGeneration(count => count + 1)}
        >
          <IconRefresh />
        </Button>
      </div>
      <Fragment key={generation}>{children}</Fragment>
    </div>
  )
}
