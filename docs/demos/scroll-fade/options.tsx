import type { ReactElement } from 'react'
import { ScrollFade } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const ROWS = PEOPLE.slice(0, 40)

// Left: mask only — no shrink, no blur, the setting for lists whose rows carry a
// gliding highlight or run taller than the box. Right: a deeper, stronger fade
export default function OptionsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {[
        { label: 'blur={0} shrink={0}', options: { blur: 0, shrink: 0 } },
        { label: 'size={56} shrink={0.06} blur={6}', options: { size: 56, shrink: 0.06, blur: 6 } },
      ].map(({ label, options }) => (
        <figure className="flex flex-col gap-2" key={label}>
          <ScrollFade
            className="no-scrollbar rounded-xl border block-64 inline-60"
            {...options}
          >
            <ul className="flex flex-col gap-1 p-4 text-sm">
              {ROWS.map(person => <li key={person.id}>{person.name}</li>)}
            </ul>
          </ScrollFade>
          <figcaption className="
            text-center font-mono text-xs text-muted-foreground
          "
          >
            {label}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
