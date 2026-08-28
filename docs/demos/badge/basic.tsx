import type { ReactElement } from 'react'
import { Badge } from '@gedatou/cadenza-ui'

// The four everyday variants side by side; the pill height and text size stay
// fixed so badges line up in a row
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  )
}
