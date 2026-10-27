import type { ReactElement } from 'react'
import { Badge, ScrollFade } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// orientation="horizontal": the overflow runs sideways, and so does the fade
export default function HorizontalDemo(): ReactElement {
  return (
    <ScrollFade className="no-scrollbar inline-96 max-inline-full" orientation="horizontal">
      <ul className="flex gap-2 py-2">
        {PEOPLE.slice(0, 24).map(person => (
          <li className="shrink-0" key={person.id}>
            <Badge variant="outline">{person.name}</Badge>
          </li>
        ))}
      </ul>
    </ScrollFade>
  )
}
