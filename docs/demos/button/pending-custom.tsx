import type { ReactElement } from 'react'
import { Button, Spinner } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// To draw the in-progress look yourself: pass disabled instead of pending --
// no veil or Spinner gets injected, children are entirely yours. This is the
// classic "spinner beside the text + swapped label" shape; the trade-off is
// that changing content changes the width (the default composition keeps a
// constant width precisely because it overlays instead of replacing)
export default function PendingCustomDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  return (
    <Button
      disabled={isPending}
      onClick={() => {
        setIsPending(true)
        setTimeout(setIsPending, 2500, false)
      }}
    >
      {isPending && <Spinner aria-hidden className="block-[1em] inline-[1em]" />}
      {isPending ? 'Saving…' : 'Save'}
    </Button>
  )
}
