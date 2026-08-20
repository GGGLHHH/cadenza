import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// All variants share one loading state: press any button and the whole row
// enters pending -- the label frosts over in place (overlaid, not replaced),
// the Spinner floats on the veil, and the width stays put. The action side
// has just this one word, pending; the content side's loading
// (LoadingOverlay) is its counterpart, not an alias.
// Anti-flicker for fast actions belongs to the caller: delay setting
// pending if you really need it
export default function PendingDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  const start = (): void => {
    setIsPending(true)
    setTimeout(setIsPending, 2500, false)
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button pending={isPending} onClick={start}>Default</Button>
      <Button pending={isPending} variant="secondary" onClick={start}>Secondary</Button>
      <Button pending={isPending} variant="outline" onClick={start}>Outline</Button>
      <Button pending={isPending} variant="ghost" onClick={start}>Ghost</Button>
      <Button pending={isPending} variant="destructive" onClick={start}>Destructive</Button>
      <Button pending={isPending} variant="link" onClick={start}>Link style</Button>
    </div>
  )
}
