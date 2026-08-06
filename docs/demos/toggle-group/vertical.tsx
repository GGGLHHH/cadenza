import type { ReactElement } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconLayoutGrid, IconLayoutList, IconTable } from '@tabler/icons-react'

// orientation="vertical":组竖排,方向键同时换成 ↑ / ↓ —— 聚焦任意一项按上下键
// 就能验证。这正是 vendored 那版对不上的地方(看着是竖的,键盘还走 ← / →)
export default function VerticalDemo(): ReactElement {
  return (
    <ToggleGroup
      aria-label="视图"
      defaultValue={['list']}
      orientation="vertical"
      variant="outline"
    >
      <ToggleGroupItem value="list">
        <IconLayoutList />
        列表
      </ToggleGroupItem>
      <ToggleGroupItem value="grid">
        <IconLayoutGrid />
        网格
      </ToggleGroupItem>
      <ToggleGroupItem value="table">
        <IconTable />
        表格
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
