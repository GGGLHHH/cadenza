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

// Composed form: the trigger and popup are existing vocabulary from the
// Select family; the only new parts are List / Item / Grip. The trigger
// shows "N / M columns" and the popup tail adds a "Reset column order"
// button — exactly what the closed form cannot offer.
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
        <SelectTrigger aria-label="Show columns" className="inline-40">
          <IconColumns
            aria-hidden
            className="text-muted-foreground block-4 inline-4"
          />
          <SelectValue>{() => `${visible.length} / ${ordered.length} columns`}</SelectValue>
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
            Reset column order
          </Button>
        </SelectPopup>
      </DataTableColumnsSelect>
      <DataTable<Person>
        aria-label="Composers (composed columns select)"
        columns={ordered.filter(column => visible.includes(column.id))}
        items={items}
      />
    </div>
  )
}
