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
  createAlertDialogHandle,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

interface Track { id: string, name: string }

const INITIAL: Track[] = [
  { id: 't1', name: 'Gaspard de la nuit' },
  { id: 't2', name: 'Miroirs' },
  { id: 't3', name: 'Le Tombeau de Couperin' },
]

// One confirm dialog serves the whole list: each row's trigger carries
// its own payload, and the root's children written as a function receive
// it. So "which row is about to be deleted" never has to become
// component state.
const handle = createAlertDialogHandle<Track>()

export default function HandleDemo(): ReactElement {
  const [tracks, setTracks] = useState(INITIAL)

  return (
    <div className="flex flex-col gap-2 inline-full max-inline-xs">
      {tracks.map(track => (
        <div className="flex items-center justify-between gap-4" key={track.id}>
          <span className="text-sm">{track.name}</span>
          <AlertDialogTrigger
            handle={handle}
            payload={track}
            render={<Button size="sm" variant="ghost" />}
          >
            Delete
          </AlertDialogTrigger>
        </div>
      ))}
      {tracks.length === 0 && <p className="text-sm text-muted-foreground">The list is empty</p>}

      <AlertDialog handle={handle}>
        {({ payload: track }) => (
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete “
                {track?.name}
                ”?
              </AlertDialogTitle>
              <AlertDialogDescription>This entry will be removed from the track list; it cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
              <AlertDialogClose
                onClick={() => setTracks(rest => rest.filter(item => item.id !== track?.id))}
                render={<Button variant="destructive" />}
              >
                Delete
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogPopup>
        )}
      </AlertDialog>
    </div>
  )
}
