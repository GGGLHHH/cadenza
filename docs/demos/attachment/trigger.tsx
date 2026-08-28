import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@gedatou/cadenza-ui'
import { IconDownload, IconFileText, IconX } from '@tabler/icons-react'

// The trigger covers the whole card at z-10 and the actions sit above it at
// z-20 — which is how "open the file" and "remove the file" coexist without
// nesting a button inside a button. Give it a name: it has no text of its own.
export default function TriggerDemo(): ReactElement {
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
          <AttachmentAction aria-label="Download programme-draft.pdf">
            <IconDownload />
          </AttachmentAction>
          <AttachmentAction aria-label="Remove programme-draft.pdf">
            <IconX />
          </AttachmentAction>
        </AttachmentActions>
        <AttachmentTrigger
          aria-label="Preview programme-draft.pdf"
          render={<a href="#trigger" />}
        />
      </Attachment>
    </div>
  )
}
