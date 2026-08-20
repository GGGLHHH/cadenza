import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'

// Every label customised: pageIndicator replaces the default "3 / 13", the
// icon buttons take translated aria-labels; when the per-page selector is
// not needed, just switch it off
export default function LabelsDemo(): ReactElement {
  return (
    <DataPagination
      defaultPage={3}
      firstPageLabel="First page"
      lastPageLabel="Last page"
      nextPageLabel="Next page"
      pageIndicator={({ page, totalPages }) => `Page ${page} of ${totalPages}`}
      previousPageLabel="Previous page"
      limitOptions={[]}
      summary={({ page, limit, total }) => {
        const start = (page - 1) * limit + 1
        const end = Math.min(page * limit, total)
        return `Items ${start}–${end} of ${total}`
      }}
      total={253}
    />
  )
}
