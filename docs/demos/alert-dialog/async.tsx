import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Async confirmation needs three things, none optional:
//
// 1. The action button is **not** an AlertDialogClose -- Close would shut
//    the dialog the moment the request starts. Use a plain Button and
//    call setOpen(false) yourself once the request succeeds.
// 2. open is controlled, otherwise step 1 has no way to close.
// 3. While the request is in flight, cancel() every close intent -- the
//    cancel button and Esc alike. Otherwise the user can close the
//    dialog mid-flight and come back to a UI that cannot say whether the
//    action went through.
export default function AsyncDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [removed, setRemoved] = useState(0)

  async function remove(): Promise<void> {
    setPending(true)
    await new Promise((resolve) => {
      setTimeout(resolve, 1200)
    })
    setPending(false)
    setOpen(false)
    setRemoved(count => count + 1)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Deleted
        {' '}
        {removed}
        {' '}
        times
      </p>

      <AlertDialog
        open={open}
        onOpenChange={(next, details) => {
          if (!next && pending) {
            details.cancel()
            return
          }
          setOpen(next)
        }}
      >
        <AlertDialogTrigger render={<Button variant="outline" />}>Delete account</AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? 'Deleting, hang on -- closing is locked out meanwhile.' : 'Deleting takes 1.2s; the dialog locks up during it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose disabled={pending} render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button
              onClick={() => {
                void remove()
              }}
              pending={pending}
              variant="destructive"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
