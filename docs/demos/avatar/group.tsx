import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupTooltip, AvatarImage } from '@gedatou/cadenza-ui'

// One picture; the rest fall back to initials
const PEOPLE = [
  { name: 'shadcn', initials: 'CN', src: '/avatars/shadcn.jpg' },
  { name: 'Ada Lovelace', initials: 'AL' },
  { name: 'Grace Hopper', initials: 'GH' },
  { name: 'Alan Turing', initials: 'AT' },
] as const

// Point at an avatar: it rises, and the one tooltip glides over from the last
// avatar instead of a new one opening
export default function GroupDemo(): ReactElement {
  return (
    <AvatarGroup>
      {PEOPLE.map(person => (
        <Avatar key={person.name}>
          {'src' in person && <AvatarImage alt="" src={person.src} />}
          <AvatarFallback>{person.initials}</AvatarFallback>
          <AvatarGroupTooltip>{person.name}</AvatarGroupTooltip>
        </Avatar>
      ))}
    </AvatarGroup>
  )
}
