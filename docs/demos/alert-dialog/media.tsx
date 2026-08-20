import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@gedatou/cadenza-ui'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useState } from 'react'

// AlertDialogMedia is the icon cell above the title (to its left on wide
// screens). The moment it appears, the header grid changes shape --
// which makes it a part, not something an inline <div> of your own could
// substitute. No size on the icon: a bare svg is collapsed to size-6
// automatically.
export default function MediaDemo(): ReactElement {
  const [revoked, setRevoked] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        API key:
        {' '}
        {revoked ? 'revoked' : 'sk-live-••••4f2a'}
      </p>

      <AlertDialog>
        <AlertDialogTrigger disabled={revoked} render={<Button variant="outline" />}>
          Revoke key
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconAlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>Revoke this key immediately?</AlertDialogTitle>
            <AlertDialogDescription>
              Every service calling the API with it will start receiving
              401s within seconds, and only a new key brings them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Keep it</AlertDialogClose>
            <AlertDialogClose
              onClick={() => setRevoked(true)}
              render={<Button variant="destructive" />}
            >
              Revoke
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
