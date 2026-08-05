import type { ReactElement } from 'react'
import { Button, LoadingOverlay } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 纯覆盖层:放进 relative 父容器,默认铺满同宽高。磨砂玻璃下内容隐约可见,
// 指针被挡住、光标是 wait;切换时两个方向都有 150ms 交叉淡入
export default function BasicDemo(): ReactElement {
  const [loading, setLoading] = useState(true)
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="
        relative overflow-hidden rounded-xl border p-4 inline-full max-inline-sm
      "
      >
        <p className="text-sm font-medium">巴黎场次</p>
        <p className="mbs-1 text-sm text-muted-foreground">
          拉威尔《G 大调钢琴协奏曲》，香榭丽舍剧院，10 月 14 日。
        </p>
        <p className="mbs-1 text-sm text-muted-foreground">
          斯特拉文斯基《春之祭》，同场加演。
        </p>
        <LoadingOverlay loading={loading} />
      </div>
      <Button size="sm" variant="outline" onClick={() => setLoading(v => !v)}>
        {loading ? '停止加载' : '开始加载'}
      </Button>
    </div>
  )
}
