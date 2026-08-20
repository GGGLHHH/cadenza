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

// size="sm": one notch narrower, the header always centered, the footer
// laid out as two equal-width columns. Use it when the two options carry
// equal weight and neither is the obvious default -- equal width is
// precisely what says "your call".
export default function SizeDemo(): ReactElement {
  const [choice, setChoice] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Last choice:
        {' '}
        {choice ?? 'none yet'}
      </p>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" />}>Leave the editor</AlertDialogTrigger>
        <AlertDialogPopup size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>Save before leaving?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              onClick={() => setChoice('Leave anyway')}
              render={<Button variant="outline" />}
            >
              Leave anyway
            </AlertDialogClose>
            <AlertDialogClose onClick={() => setChoice('Save and leave')} render={<Button />}>
              Save and leave
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
