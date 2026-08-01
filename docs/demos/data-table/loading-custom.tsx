import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable, DataTableLoadingOverlay, Spinner } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// Slotted 定制:标记部件写在插槽通道里、原地不渲染,由卡片提升到覆盖层位置。
// children 替换居中的 Spinner,className 调磨砂浓度
export default function LoadingCustomDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="作曲家(定制加载)"
      columns={personColumns}
      isLoading
      items={PEOPLE.slice(0, 4)}
    >
      <DataTableLoadingOverlay className="backdrop-blur-xs">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-hidden />
          正在同步演出数据…
        </span>
      </DataTableLoadingOverlay>
    </DataTable>
  )
}
