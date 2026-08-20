import type { ScrollAreaScrollbars } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const MODES: ScrollAreaScrollbars[] = ['always', 'hover', 'hidden']

// Three scrollbar modes: always shown / hover shows on hover and while
// scrolling (the default) / hidden renders none
export default function ScrollbarsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      {MODES.map(mode => (
        <div className="flex flex-col gap-2" key={mode}>
          <span className="text-xs text-muted-foreground">{mode}</span>
          <ScrollArea className="rounded-xl border block-48 inline-52" scrollbars={mode}>
            <ul className="flex flex-col gap-1 p-3 text-sm">
              {PEOPLE.slice(0, 30).map(person => (
                <li key={person.id}>{person.name}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
