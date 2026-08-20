import type { ReactElement } from 'react'
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// Inner scroll: header and footer stay pinned, only the middle scrolls.
// Writing one DialogBody is enough -- the popup sees it, caps itself to
// the screen height, and switches to flex layout (a :has rule); no prop
// or class name required. The popup no longer exceeds the viewport, the
// outer scroll has nothing left to scroll, and it steps aside on its own.
//
// The item count matches the scroll demo at 80: fewer would not fill the
// capped height on a tall screen, nothing would scroll, and the demo
// would demonstrate nothing.
const ROSTER = PEOPLE.slice(0, 80)

export default function ScrollInsideDemo(): ReactElement {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>View roster</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Full roster</DialogTitle>
          <DialogDescription>
            {ROSTER.length}
            {' '}
            people; header and footer stay put -- "Close" never leaves your sight.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ol className="flex flex-col gap-2">
            {ROSTER.map((person, index) => (
              <li className="flex justify-between gap-4" key={person.id}>
                <span>
                  <span className="text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {' '}
                  {person.name}
                </span>
                <span className="text-muted-foreground">{person.role}</span>
              </li>
            ))}
          </ol>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
