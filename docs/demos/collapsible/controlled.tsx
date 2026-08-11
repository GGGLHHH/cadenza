import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// open + onOpenChange 把开合状态交出来:外部按钮和 trigger 改的是同一个 state,
// 第二参 details.reason 能分出这次是谁按的
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
          {open ? '收起' : '展开'}
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <p className="rounded-md border p-4 text-sm text-muted-foreground">
            面板内容。开合状态存在外面的 useState 里。
          </p>
        </CollapsiblePanel>
      </Collapsible>

      <div className="flex items-center gap-2">
        <Button onClick={() => setOpen(value => !value)} size="sm" variant="secondary">
          在外面切换
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
