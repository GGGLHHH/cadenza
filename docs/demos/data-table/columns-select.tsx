import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable, DataTableColumnsSelect } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// 列选择器不自己藏列、也不自己排序 —— 它只报「哪些 id 可见」和「新的 id 顺序」,
// 过滤和排序都是调用方一行。摊在明面上是有意的:同一个控件因此也能驱动
// 状态存在别处的表格(TanStack Table 的 columnVisibility / columnOrder、URL 参数)。
const allColumns: DataTableColumn<Person>[] = [
  // 行名列锁死:读屏按它播报行,藏掉整张表就没了名字。
  { ...personColumns[0], hideable: false },
  ...personColumns.slice(1),
]

const items = PEOPLE.slice(0, 6)

export default function ColumnsSelectDemo(): ReactElement {
  const [order, setOrder] = useState<string[]>(allColumns.map(column => column.id))
  const [visible, setVisible] = useState<string[]>(allColumns.map(column => column.id))

  // 顺序是 id 列表,列定义按它排 —— 表格永远只渲染你交给它的那些列。
  const ordered = order.map(id => allColumns.find(column => column.id === id)!)

  return (
    <div className="flex flex-col gap-3 inline-full">
      <DataTableColumnsSelect
        aria-label="显示列"
        className="inline-56"
        columns={ordered}
        placeholder="全部"
        value={visible}
        // Committed,不是 Change:拖动期间顺序只活在选择器内部,
        // 下面这张表要等松手才动一次。
        onOrderCommitted={setOrder}
        onValueChange={setVisible}
      />
      <DataTable<Person>
        aria-label="作曲家(列选择器)"
        columns={ordered.filter(column => visible.includes(column.id))}
        items={items}
      />
    </div>
  )
}
