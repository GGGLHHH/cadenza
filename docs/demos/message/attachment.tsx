import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Bubble,
  BubbleContent,
  Message,
  MessageContent,
} from '@gedatou/cadenza-ui'
import { IconFileText } from '@tabler/icons-react'

// An attachment is just another child of MessageContent — it sits above or
// below the bubble and inherits the row's alignment, so a file sent by the
// user lands on the same side as the user's text.
export default function AttachmentDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Message align="end">
        <MessageContent>
          <Attachment>
            <AttachmentMedia>
              <IconFileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>programme-draft.pdf</AttachmentTitle>
              <AttachmentDescription>240 KB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Bubble variant="muted">
            <BubbleContent>Here is the draft — check the interval length.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  )
}
