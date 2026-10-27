import type { ReactElement } from 'react'
import { PlusIcon } from '@gedatou/cadenza-icons'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@gedatou/cadenza-ui'

// One picture; the rest fall back to initials
const PEOPLE = [
  { name: 'shadcn', initials: 'CN', src: '/avatars/shadcn.jpg' },
  { name: 'Ada Lovelace', initials: 'AL' },
  { name: 'Grace Hopper', initials: 'GH' },
  { name: 'Alan Turing', initials: 'AT' },
] as const

// An icon in place of the count — the slot for "invite someone"
export default function GroupCountIconDemo(): ReactElement {
  return (
    <AvatarGroup>
      {PEOPLE.slice(0, 3).map(person => (
        <Avatar key={person.name}>
          {'src' in person && <AvatarImage alt="" src={person.src} />}
          <AvatarFallback>{person.initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>
        <PlusIcon />
      </AvatarGroupCount>
    </AvatarGroup>
  )
}
