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

// Async save: the action button is **not** a DialogClose -- Close would
// shut the dialog the moment the request starts. Use a plain Button +
// controlled open, and call setOpen(false) yourself once the request
// succeeds.
//
// While saving, cancel() every close intent. Dialog has two more routes
// to block than AlertDialog: the top-right ✕ and backdrop clicks.
// cancel() ignores reason and blocks them all at once, so there is no
// need for disablePointerDismissal or showCloseButton={false} here --
// those are permanent, while the "lock" should only last until the
// request returns.
export default function AsyncDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(INITIAL_NAME)
  const [draft, setDraft] = useState(INITIAL_NAME)
  const [pending, setPending] = useState(false)

  async function save(): Promise<void> {
    setPending(true)
    await new Promise((resolve) => {
      setTimeout(resolve, 1200)
    })
    setName(draft)
    setPending(false)
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Current display name:
        {' '}
        <span className="font-medium text-foreground">{name}</span>
      </p>

      <Dialog
        open={open}
        onOpenChange={(next, details) => {
          if (!next && pending) {
            details.cancel()
            return
          }
          if (next) {
            setDraft(name)
          }
          setOpen(next)
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>Edit profile</DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              {pending ? 'Saving -- ✕, the backdrop, and Esc are all locked out right now.' : 'Saving takes 1.2s; the dialog locks up meanwhile.'}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="dialog-async-name">Display name</FieldLabel>
            <Input
              disabled={pending}
              id="dialog-async-name"
              onValueChange={setDraft}
              value={draft}
            />
          </Field>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={() => {
                void save()
              }}
              pending={pending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
