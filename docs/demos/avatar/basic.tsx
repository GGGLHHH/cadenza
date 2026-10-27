import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@gedatou/cadenza-ui'

// An image with its fallback, and a fallback alone: the initials show until the
// image loads, and stay when there is none
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage alt="shadcn" src="/avatars/shadcn.jpg" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
    </div>
  )
}
