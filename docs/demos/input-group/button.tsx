import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconArrowRight, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'

// Trailing buttons: InputGroupButton wraps Base UI's Button underneath.
// size defaults to xs; icon buttons use icon-xs
export default function ButtonDemo(): ReactElement {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupInput aria-label="Invite link" defaultValue="https://cadenza.dev/invite/8f2a" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Copy link"
            size="icon-xs"
            onClick={() => {
              setCopied(true)
              setTimeout(setCopied, 1500, false)
            }}
          >
            <IconCopy aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Subscription email" placeholder="Subscribe to updates" type="email" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="default">
            Subscribe
            <IconArrowRight aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {copied ? 'Copied to clipboard' : ' '}
      </p>
    </div>
  )
}
