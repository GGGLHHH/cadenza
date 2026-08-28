import type { AttachmentState } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Spinner,
} from '@gedatou/cadenza-ui'
import { IconAlertTriangle, IconFileText, IconPlus } from '@tabler/icons-react'

const STATES: { state: AttachmentState, note: string }[] = [
  { state: 'idle', note: 'Drop a file' },
  { state: 'uploading', note: '2.1 MB of 4.8 MB' },
  { state: 'processing', note: 'Extracting text' },
  { state: 'error', note: 'Upload failed — try again' },
  { state: 'done', note: '4.8 MB' },
]

// state only writes data-state; every part reacts to it. The border goes
// dashed while idle, destructive on error, and the title picks up the shimmer
// utility while bytes are moving. You drive it from whatever actually uploads.
export default function StatesDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      {STATES.map(({ state, note }) => (
        <Attachment key={state} state={state}>
          <AttachmentMedia>
            {state === 'idle' && <IconPlus />}
            {state === 'error' && <IconAlertTriangle />}
            {(state === 'uploading' || state === 'processing') && <Spinner />}
            {state === 'done' && <IconFileText />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>rehearsal-notes.pdf</AttachmentTitle>
            <AttachmentDescription>{note}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  )
}
