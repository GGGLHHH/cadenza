import type { ReactElement } from 'react'
import { Badge } from '@gedatou/cadenza-ui'

// Custom colours are plain utility classes on className; the variant still
// provides the shape, and each pair carries its own dark: counterpart
export default function ColorsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="
        bg-green-50 text-green-700
        dark:bg-green-900 dark:text-green-200
      "
      >
        Passing
      </Badge>
      <Badge className="
        bg-amber-50 text-amber-700
        dark:bg-amber-900 dark:text-amber-200
      "
      >
        Pending
      </Badge>
      <Badge className="
        bg-sky-50 text-sky-700
        dark:bg-sky-900 dark:text-sky-200
      "
      >
        Info
      </Badge>
    </div>
  )
}
