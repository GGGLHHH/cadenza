import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  DataTable,
  DataTableColumnsSelect,
  DataTableColumnsSelectGrip,
  DataTableColumnsSelectItem,
  DataTableColumnsSelectList,
  SelectPopup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { IconColumns } from '@tabler/icons-react'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// 组合形态:触发器、弹层是 Select 家族的现有词汇,新部件只有 List / Item / Grip。
// 触发器显示「N / M 列」,弹层尾部多一个「恢复默认顺序」—— 这正是闭合形态给不了的。
const allColumns: DataTableColumn<Person>[] = [
  { ...personColumns[0], hideable: false },
  ...personColumns.slice(1),
]
const defaultOrder = allColumns.map(column => column.id)
const items = PEOPLE.slice(0, 6)

export default function ColumnsSelectComposedDemo(): ReactElement {
  const [order, setOrder] = useState<string[]>(defaultOrder)
  const [visible, setVisible] = useState<string[]>(defaultOrder)
  const ordered = order.map(id => allColumns.find(column => column.id === id)!)

  return (
    <div className="flex flex-col gap-3 inline-full">
      <DataTableColumnsSelect
        columns={ordered}
        value={visible}
        onOrderCommitted={setOrder}
        onValueChange={setVisible}
      >
        <SelectTrigger aria-label="显示列" className="inline-40">
          <IconColumns
            aria-hidden
            className="text-muted-foreground block-4 inline-4"
          />
          <SelectValue>{() => `${visible.length} / ${ordered.length} 列`}</SelectValue>
        </SelectTrigger>
        <SelectPopup>
          <DataTableColumnsSelectList>
            {column => (
              <DataTableColumnsSelectItem column={column}>
                <DataTableColumnsSelectGrip />
                {column.header}
              </DataTableColumnsSelectItem>
            )}
          </DataTableColumnsSelectList>
          <SelectSeparator />
          <Button
            className="justify-start inline-full"
            size="sm"
            variant="ghost"
            onClick={() => setOrder(defaultOrder)}
          >
            恢复默认顺序
          </Button>
        </SelectPopup>
      </DataTableColumnsSelect>
      <DataTable<Person>
        aria-label="作曲家(组合列选择器)"
        columns={ordered.filter(column => visible.includes(column.id))}
        items={items}
      />
    </div>
  )
}
