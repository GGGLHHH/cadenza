import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'

// Uncontrolled: defaultPage / defaultLimit, the component holds its own
// state. The component itself ships zero copy -- the summary and the
// "per page" label are both injected from outside
export default function BasicDemo(): ReactElement {
  return (
    <DataPagination
      defaultLimit={10}
      defaultPage={3}
      limitOptions={[10, 20, 50]}
      rowsPerPageLabel="Per page"
      summary={({ total }) => `${total} items`}
      total={123}
    />
  )
}
