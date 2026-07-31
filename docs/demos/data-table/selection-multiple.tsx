import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

export default function MultiSelectionDemo(): ReactElement {
  const [ids, setIds] = useState<string[]>([])
  const [lastOpened, setLastOpened] = useState<string | undefined>(undefined)

  return (
    <div className="flex flex-col gap-2">
      {/* onRowAction 在场时,点击行是"打开",勾选走 checkbox 列 */}
      <DataTable<Person>
        aria-label="作曲家(可多选)"
        columns={personColumns}
        items={PEOPLE.slice(0, 6)}
        onChange={(_items, nextIds) => setIds(nextIds)}
        onRowAction={person => setLastOpened(person.name)}
        selectionColumn
        selectionMode="multiple"
        value={ids}
      />
      <p className="text-sm text-muted-foreground">
        已选
        {' '}
        {ids.length}
        {' '}
        行
        {lastOpened !== undefined && `,最近打开:${lastOpened}`}
      </p>
    </div>
  )
}
