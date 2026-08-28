import type { ReactElement } from 'react'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@gedatou/cadenza-ui'

// An inline SVG stands in for a real upload here so the demo needs no network.
const SCORE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#3f3f46"/><g stroke="#a1a1aa" stroke-width="2">${[20, 30, 40, 50, 60].map(y => `<line x1="8" y1="${y}" x2="72" y2="${y}"/>`).join('')}</g><circle cx="28" cy="40" r="6" fill="#fafafa"/><circle cx="52" cy="30" r="6" fill="#fafafa"/></svg>`,
)}`

// variant="image" fills the media box edge to edge; orientation="vertical"
// turns the card into a fixed-width tile with the picture on top.
export default function ImageDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-wrap gap-3 inline-full max-inline-sm">
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <img alt="Two notes on a stave" src={SCORE} />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>bar-42.png</AttachmentTitle>
          <AttachmentDescription>1.2 MB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment>
        <AttachmentMedia variant="image">
          <img alt="Two notes on a stave" src={SCORE} />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>bar-42.png</AttachmentTitle>
          <AttachmentDescription>Horizontal</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  )
}
