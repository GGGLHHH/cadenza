import type { ReactElement, ReactNode } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { IconRefresh } from '@tabler/icons-react'
import { Fragment, useState } from 'react'

// Demo-only scaffolding. Every stateful demo accumulates state you cannot undo
// from the UI — messages sent, history loaded, the reader's own scroll
// position — and the only way back would be reloading the page, which resets
// the other demos with it. Bumping the key remounts just this one, so every
// piece of state inside it starts over; `onReset` runs first so a demo that
// persists (IndexedDB, localStorage) can wipe its own store before remounting.
export function ResettableDemo({
  children,
  className = 'max-inline-sm',
  onReset,
}: {
  children: ReactNode
  className?: string
  onReset?: () => void | Promise<void>
}): ReactElement {
  const [generation, setGeneration] = useState(0)
  const reset = async (): Promise<void> => {
    await onReset?.()
    setGeneration(count => count + 1)
  }

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
          onClick={() => {
            void reset()
          }}
        >
          <IconRefresh />
        </Button>
      </div>
      <Fragment key={generation}>{children}</Fragment>
    </div>
  )
}
