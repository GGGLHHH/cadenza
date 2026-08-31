import type { ReactElement } from 'react'
import { Badge } from '@gedatou/cadenza-ui'

// render swaps the span for an <a>: the badge classes stay, and the [a]:hover
// rules in each variant light up only now that the element is a real link
export default function LinkDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge render={<a href="#link" />}>Changelog</Badge>
      <Badge variant="secondary" render={<a href="#link" />}>
        Docs
      </Badge>
      <Badge variant="outline" render={<a href="#link" />}>
        Source
      </Badge>
    </div>
  )
}
