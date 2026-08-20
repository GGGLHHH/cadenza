import type { ReactElement } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// Outer scroll: when the content is taller than the screen, the whole
// dialog (header and footer included) scrolls over the backdrop. No
// overflow to write -- the Dialog.Viewport built into DialogPopup is
// that scroll container.
//
// The count is 80 rather than a "looks like plenty" twenty or thirty: a
// demo should not bet on the reader's screen height; even the tallest
// screen must fail to fit it, or this page demos an ordinary dialog.
// The indices are for macOS -- its overlay scrollbars hide until you
// scroll, and without numbers it is hard to confirm you scrolled at all.
const ROSTER = PEOPLE.slice(0, 80)

export default function ScrollDemo(): ReactElement {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>View roster</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Full roster</DialogTitle>
          <DialogDescription>
            {ROSTER.length}
            {' '}
            people; header and footer scroll along -- "Close" only appears at the very bottom.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
