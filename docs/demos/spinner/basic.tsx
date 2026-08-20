import type { ReactElement } from 'react'
import { Spinner } from '@gedatou/cadenza-ui'

// Size and colour both come from className; defaults to size-4 and
// inherits the text colour
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
      <Spinner className="block-6 inline-6" />
      <Spinner className="text-primary block-8 inline-8" />
    </div>
  )
}
