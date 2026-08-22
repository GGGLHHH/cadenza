import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@gedatou/cadenza-ui'
import { IconFileText, IconMusic, IconPhoto, IconTable } from '@tabler/icons-react'

const FILES = [
  { icon: <IconFileText />, name: 'programme-draft.pdf', size: '240 KB' },
  { icon: <IconMusic />, name: 'la-mer-parts.zip', size: '18 MB' },
  { icon: <IconPhoto />, name: 'stage-plan.png', size: '1.2 MB' },
  { icon: <IconTable />, name: 'seating.csv', size: '9 KB' },
]

// A snapping, horizontally scrolling row with edge fades and no visible
// scrollbar — the strip that sits under a composer. Scroll it sideways.
export default function GroupDemo(): ReactElement {
  return (
    <div className="mx-auto inline-full max-inline-sm">
      <AttachmentGroup>
        {FILES.map(file => (
          <Attachment key={file.name}>
            <AttachmentMedia>{file.icon}</AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>{file.size}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        ))}
      </AttachmentGroup>
    </div>
  )
}
