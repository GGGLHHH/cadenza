import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// open + onOpenChange hand the open state over: the external button and the
// trigger mutate the same state, and the second argument's details.reason
// tells you which one fired this change
export default function ControlledDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('—')

  return (
    <div className="flex flex-col gap-3 inline-80">
      <Collapsible
        className="flex flex-col gap-2"
        onOpenChange={(next, details) => {
          setOpen(next)
          setReason(details.reason)
        }}
        open={open}
      >
        <CollapsibleTrigger render={<Button variant="outline" />}>
          {open ? 'Collapse' : 'Expand'}
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <p className="rounded-md border p-4 text-sm text-muted-foreground">
            Panel content. The open state lives in an external useState.
          </p>
        </CollapsiblePanel>
      </Collapsible>

      <div className="flex items-center gap-2">
        <Button onClick={() => setOpen(value => !value)} size="sm" variant="secondary">
          Toggle from outside
        </Button>
        <span className="text-xs text-muted-foreground">
          reason:
          {' '}
          <code>{reason}</code>
        </span>
      </div>
    </div>
  )
}
