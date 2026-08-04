import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

export default function SingleSelectionDemo(): ReactElement {
  const [picked, setPicked] = useState<Person | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <DataTable<Person>
        aria-label="作曲家(单选)"
        columns={personColumns}
        items={PEOPLE.slice(0, 6)}
        onChange={setPicked}
        selectionColumn
        selectionMode="single"
        value={picked?.id ?? null}
      />
      <p className="text-sm text-muted-foreground">
        {picked ? `当前选中:${picked.name}` : '未选择'}
      </p>
    </div>
  )
}
