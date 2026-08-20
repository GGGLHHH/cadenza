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

// Both exits are AlertDialogClose; the working one carries its job in
// onClick -- closing is what it would do anyway. No top-right ✕: an
// alert dialog exists to force an answer, and a non-committal exit
// contradicts that.
export default function BasicDemo(): ReactElement {
  const [drafts, setDrafts] = useState(['Gaspard de la nuit', 'Miroirs', 'Pavane pour une infante défunte'])

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        {drafts.length}
        {' '}
        drafts
        {drafts.length > 0 && `: ${drafts.join(', ')}`}
      </p>

      <AlertDialog>
        <AlertDialogTrigger
          disabled={drafts.length === 0}
          render={<Button variant="outline" />}
        >
          Delete the last one
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “
              {drafts.at(-1)}
              ”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A deleted draft cannot be recovered; make sure this is not
              the one you still need.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <AlertDialogClose
              onClick={() => setDrafts(rest => rest.slice(0, -1))}
              render={<Button variant="destructive" />}
            >
              Delete
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
