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
      {/* With onRowAction present, clicking a row means "open";
          selection goes through the checkbox column */}
      <DataTable<Person>
        aria-label="Composers (multi-select)"
        columns={personColumns}
        items={PEOPLE.slice(0, 6)}
        onValueChange={(_items, nextIds) => setIds(nextIds)}
        onRowAction={person => setLastOpened(person.name)}
        selectionColumn
        selectionMode="multiple"
        value={ids}
      />
      <p className="text-sm text-muted-foreground">
        {ids.length}
        {' '}
        rows selected
        {lastOpened !== undefined && `, last opened: ${lastOpened}`}
      </p>
    </div>
  )
}
