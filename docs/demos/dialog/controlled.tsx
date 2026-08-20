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

// Controlled + close interception. Once the content is dirty, backdrop
// clicks and Esc get bounced by cancel() -- internal state stays put; no
// disablePointerDismissal plus a hand-rolled check on top. reason says
// where the close came from, so the discard button (close-press) passes
// through as usual.
export default function ControlledDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Maurice Ravel')
  const [blocked, setBlocked] = useState(false)
  const dirty = name !== 'Maurice Ravel'

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && dirty && details.reason !== 'close-press') {
          details.cancel()
          setBlocked(true)
          return
        }
        setBlocked(false)
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>Edit profile</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            {dirty ? 'Dirty now -- backdrop clicks and Esc are both intercepted.' : 'Try changing a character or two.'}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="dialog-controlled-name">Display name</FieldLabel>
          <Input
            id="dialog-controlled-name"
            value={name}
            onValueChange={setName}
          />
        </Field>
        {blocked && (
          <p className="text-sm text-destructive">There are unsaved changes; leave via the buttons below.</p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Discard changes</DialogClose>
          <Button onClick={() => setOpen(false)}>Save</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
