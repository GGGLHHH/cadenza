import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// isPending:标签原地隐形(继续撑宽度),Spinner 居中交叉淡入 —— 宽度不变,
// 邻居不位移。isLoading 是别名,任一为真即进行中
// 快操作防闪属于调用方:确有需要就延迟置起 isPending
export default function PendingDemo(): ReactElement {
  const [isPending, setIsPending] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        isPending={isPending}
        onPress={() => {
          setIsPending(true)
          setTimeout(setIsPending, 2500, false)
        }}
      >
        保存
      </Button>
      <Button isLoading variant="outline">isLoading 别名</Button>
    </div>
  )
}
