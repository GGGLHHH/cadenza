import type { ReactElement } from 'react'
import { AnimateIcon, BellIcon, RefreshCwIcon, SendIcon } from '@gedatou/cadenza-icons'
import { Button } from '@gedatou/cadenza-ui'

// AnimateIcon carries the trigger, so the whole button is the hover target and
// the icon inside plays — no trigger prop on the icon itself.
export default function ParentDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AnimateIcon animateOnHover>
        <Button>
          <SendIcon size={16} />
          Send
        </Button>
      </AnimateIcon>
      <AnimateIcon animateOnHover>
        <Button variant="outline">
          <BellIcon size={16} />
          Notifications
        </Button>
      </AnimateIcon>
      <AnimateIcon animateOnTap>
        <Button variant="secondary">
          <RefreshCwIcon size={16} />
          Refresh
        </Button>
      </AnimateIcon>
    </div>
  )
}
