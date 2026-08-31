'use client'
import type { AudioPart, DocumentPart, ImagePart, VideoPart } from '@tanstack/ai/client'
import type { ReactElement } from 'react'
import { Attachment, AttachmentContent, AttachmentMedia, AttachmentTitle } from '@gedatou/cadenza-ui'
import { IconFileText } from '@tabler/icons-react'

export interface MediaPartProps {
  part: ImagePart | AudioPart | VideoPart | DocumentPart
  className?: string
}

function nameOf(metadata: unknown): string | undefined {
  const name = (metadata as { name?: unknown } | undefined)?.name
  return typeof name === 'string' ? name : undefined
}

/** A message's media part rendered by type: image card, native audio / video, document card. */
export function MediaPart({ part, className }: MediaPartProps): ReactElement {
  const { source } = part
  const src = source.type === 'data' ? `data:${source.mimeType};base64,${source.value}` : source.value
  const name = nameOf(part.metadata)
  switch (part.type) {
    case 'image':
      return (
        <Attachment data-slot="media-part" data-type="image" size="sm" orientation="vertical" className={className}>
          <AttachmentMedia variant="image"><img src={src} alt={name ?? ''} /></AttachmentMedia>
        </Attachment>
      )
    case 'audio':
      return <audio data-slot="media-part" data-type="audio" controls src={src} className={className} />
    case 'video':
      return <video data-slot="media-part" data-type="video" controls src={src} className={className} />
    case 'document':
      return (
        <Attachment data-slot="media-part" data-type="document" size="sm" className={className}>
          <AttachmentMedia><IconFileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{name ?? source.mimeType?.split('/')[1] ?? source.value}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      )
  }
}
