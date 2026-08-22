import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@gedatou/cadenza-ui'
import { IconFileText, IconX } from '@tabler/icons-react'

// A file card: media, metadata, actions. Nothing here uploads anything — the
// component renders whatever state you hand it.
export default function BasicDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      <Attachment>
        <AttachmentMedia>
          <IconFileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>programme-draft.pdf</AttachmentTitle>
          <AttachmentDescription>240 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove programme-draft.pdf">
            <IconX />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  )
}
