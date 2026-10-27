import type { ReactElement } from 'react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarGroupTooltip, AvatarImage } from '@gedatou/cadenza-ui'

// One picture; the rest fall back to initials
const PEOPLE = [
  { name: 'shadcn', initials: 'CN', src: '/avatars/shadcn.jpg' },
  { name: 'Ada Lovelace', initials: 'AL' },
  { name: 'Grace Hopper', initials: 'GH' },
  { name: 'Alan Turing', initials: 'AT' },
] as const

// The rest of the group as a count; it rises like the avatars and can carry
// its own tooltip
export default function GroupCountDemo(): ReactElement {
  return (
    <AvatarGroup>
      {PEOPLE.slice(0, 3).map(person => (
        <Avatar key={person.name}>
          {'src' in person && <AvatarImage alt="" src={person.src} />}
          <AvatarFallback>{person.initials}</AvatarFallback>
          <AvatarGroupTooltip>{person.name}</AvatarGroupTooltip>
        </Avatar>
      ))}
      <AvatarGroupCount>
        +3
        <AvatarGroupTooltip>3 more</AvatarGroupTooltip>
      </AvatarGroupCount>
    </AvatarGroup>
  )
}
