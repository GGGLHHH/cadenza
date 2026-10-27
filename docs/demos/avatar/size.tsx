import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@gedatou/cadenza-ui'

// The three sizes; the fallback text and the badge follow data-size
export default function SizeDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      {(['sm', 'default', 'lg'] as const).map(size => (
        <Avatar key={size} size={size}>
          <AvatarImage alt="shadcn" src="/avatars/shadcn.jpg" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
