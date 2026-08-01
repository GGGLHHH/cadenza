import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 全变体公用一个 loading 状态:点任意一颗,整排进入 pending —— 标签原地被磨砂
// 融开(覆盖不替换)、Spinner 浮在暗纱上、宽度不变。isLoading 是 isPending 的别名;
// 快操作防闪属于调用方:确有需要就延迟置起 isPending
export default function PendingDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  const start = (): void => {
    setIsPending(true)
    setTimeout(setIsPending, 2500, false)
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button isPending={isPending} onPress={start}>默认</Button>
      <Button isPending={isPending} variant="secondary" onPress={start}>次要</Button>
      <Button isPending={isPending} variant="outline" onPress={start}>描边</Button>
      <Button isPending={isPending} variant="ghost" onPress={start}>幽灵</Button>
      <Button isPending={isPending} variant="destructive" onPress={start}>危险</Button>
      <Button isPending={isPending} variant="link" onPress={start}>链接样式</Button>
    </div>
  )
}
