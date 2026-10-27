import type { ReactElement } from 'react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@gedatou/cadenza-ui'

// A status dot at the bottom right; className recolours it
export default function BadgeDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage alt="shadcn" src="/avatars/shadcn.jpg" />
        <AvatarFallback>CN</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <Avatar>
        <AvatarFallback>ER</AvatarFallback>
        <AvatarBadge className="
          bg-green-600
          dark:bg-green-800
        "
        />
      </Avatar>
    </div>
  )
}
