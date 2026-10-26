import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { AnimateIcon, Bell, RefreshCw, Send } from '@gedatou/cadenza-ui/icons'

// AnimateIcon carries the trigger, so the whole button is the hover target and
// the icon inside plays — no trigger prop on the icon itself.
export default function ParentDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <AnimateIcon animateOnHover>
        <Button>
          <Send size={16} />
          Send
        </Button>
      </AnimateIcon>
      <AnimateIcon animateOnHover>
        <Button variant="outline">
          <Bell size={16} />
          Notifications
        </Button>
      </AnimateIcon>
      <AnimateIcon animateOnTap>
        <Button variant="secondary">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </AnimateIcon>
    </div>
  )
}
