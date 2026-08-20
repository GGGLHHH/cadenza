import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  createDialogHandle,
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

// One handle wires three triggers to the same dialog -- the triggers need
// not be its children, and no state is threaded through the layers in
// between. Each trigger carries its own payload; write the root's
// children as a function to receive it, so "which row is selected" never
// has to become component state.
const handle = createDialogHandle<Person>()

export default function HandleDemo(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {PEOPLE.slice(0, 3).map(person => (
        <DialogTrigger
          handle={handle}
          key={person.id}
          payload={person}
          render={<Button variant="outline" />}
        >
          {person.name}
        </DialogTrigger>
      ))}

      <Dialog handle={handle}>
        {({ payload: person }) => (
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>{person?.name}</DialogTitle>
              <DialogDescription>
                {person?.role}
                {', born '}
                {person?.born}
                {', '}
                {person?.works}
                {' works.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            </DialogFooter>
          </DialogPopup>
        )}
      </Dialog>
    </div>
  )
}
