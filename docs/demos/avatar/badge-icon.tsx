import type { ReactElement } from 'react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@gedatou/cadenza-ui'
import { PlusIcon } from '@gedatou/cadenza-ui/icons'

// An icon inside the badge; the badge sizes it to the avatar
export default function BadgeIconDemo(): ReactElement {
  return (
    <Avatar size="lg">
      <AvatarImage alt="shadcn" src="/avatars/shadcn.jpg" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge>
        <PlusIcon />
      </AvatarBadge>
    </Avatar>
  )
}
