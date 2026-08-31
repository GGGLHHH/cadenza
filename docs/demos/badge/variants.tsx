import type { ReactElement } from 'react'
import { Badge } from '@gedatou/cadenza-ui'

// All six variants; ghost and link have no surface until hovered, which is
// what makes them usable as inline tags
export default function VariantsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  )
}
