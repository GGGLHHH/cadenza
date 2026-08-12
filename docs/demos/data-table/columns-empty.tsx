import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  DataTable,
  DataTableColumnsEmpty,
  DataTableColumnsSelect,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// 一列都不锁,用户就能把列全部藏掉 —— 那时行没有任何单元格可渲染,表格退回
// 状态区,文案与恢复动作从 DataTableColumnsEmpty 插槽进来(基座零文案,家法不变)。
const allIds = personColumns.map(column => column.id)
const items = PEOPLE.slice(0, 4)

export default function ColumnsEmptyDemo(): ReactElement {
  const [visible, setVisible] = useState<string[]>(allIds)

  return (
    <div className="flex flex-col gap-3 inline-full">
      <DataTableColumnsSelect
        aria-label="显示列"
        className="inline-56"
        columns={personColumns}
        placeholder="没有可见的列"
        value={visible}
        onValueChange={setVisible}
      />
      <DataTable<Person>
        aria-label="作曲家(可清空列)"
        columns={personColumns.filter(column => visible.includes(column.id))}
        items={items}
      >
        <DataTableColumnsEmpty className="flex flex-col items-center gap-2">
          所有列都被隐藏了
          <Button size="sm" variant="outline" onClick={() => setVisible(allIds)}>
            显示全部列
          </Button>
        </DataTableColumnsEmpty>
      </DataTable>
    </div>
  )
}
