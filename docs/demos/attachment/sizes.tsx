import type { AttachmentSize } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@gedatou/cadenza-ui'
import { IconFileText } from '@tabler/icons-react'

const SIZES: AttachmentSize[] = ['default', 'sm', 'xs']

// Size shrinks the media box, the padding and the type together — xs is the
// one for a composer strip, where the card is a chip rather than a card.
export default function SizesDemo(): ReactElement {
  return (
    <div className="
      mx-auto flex flex-col items-start gap-3 inline-full max-inline-sm
    "
    >
      {SIZES.map(size => (
        <Attachment key={size} size={size}>
          <AttachmentMedia>
            <IconFileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>programme-draft.pdf</AttachmentTitle>
            <AttachmentDescription>{size}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  )
}
