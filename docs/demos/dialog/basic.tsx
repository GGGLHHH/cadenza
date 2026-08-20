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
  Field,
  FieldLabel,
  Input,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const INITIAL_NAME = 'Maurice Ravel'

// The full composition: one DialogPopup component brings the portal, the
// backdrop, the scroll viewport, and the top-right close ✕ -- you only
// write the content.
//
// "Save" is a DialogClose with a side effect: closing is what it would do
// anyway, and onClick adds the commit. That way open never needs lifting
// into controlled state -- that's only needed to intercept a close, see
// "Close routes and interception". The draft resets on open, so "Cancel"
// and ✕ have nothing to do; discarding is the default outcome.
export default function BasicDemo(): ReactElement {
  const [name, setName] = useState(INITIAL_NAME)
  const [draft, setDraft] = useState(INITIAL_NAME)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Current display name:
        {' '}
        <span className="font-medium text-foreground">{name}</span>
      </p>

      <Dialog>
        <DialogTrigger onClick={() => setDraft(name)} render={<Button variant="outline" />}>
          Edit profile
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Remember to save; closing directly does not commit.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="dialog-basic-name">Display name</FieldLabel>
            <Input id="dialog-basic-name" onValueChange={setDraft} value={draft} />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose onClick={() => setName(draft)} render={<Button />}>
              Save
            </DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
