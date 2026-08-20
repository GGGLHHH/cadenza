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
        aria-label="Composers (single select)"
        columns={personColumns}
        items={PEOPLE.slice(0, 6)}
        onValueChange={setPicked}
        selectionColumn
        selectionMode="single"
        value={picked?.id ?? null}
      />
      <p className="text-sm text-muted-foreground">
        {picked ? `Currently selected: ${picked.name}` : 'Nothing selected'}
      </p>
    </div>
  )
}
