import type { ReactElement } from 'react'
import { Badge } from '@gedatou/cadenza-ui'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'

// data-icon="inline-start" / "inline-end" pulls the padding in on the icon's
// side so the pill stays visually balanced; svgs are forced to size-3
export default function IconDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>
        <IconCheck data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Next
        <IconArrowRight data-icon="inline-end" />
      </Badge>
    </div>
  )
}
