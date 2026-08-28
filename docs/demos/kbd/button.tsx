import type { ReactElement } from 'react'
import { Button, Kbd } from '@gedatou/cadenza-ui'

// Inside a Button the key just sits inline after the label; pointer events
// are off on the key, so the whole button stays the click target
export default function ButtonDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline">
        Accept
        <Kbd>⏎</Kbd>
      </Button>
      <Button variant="outline">
        Cancel
        <Kbd>Esc</Kbd>
      </Button>
    </div>
  )
}
