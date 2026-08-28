import type { ReactElement } from 'react'
import { ComposerAttach, ComposerAttachments, useAttachmentDraft, useChat } from '@gedatou/cadenza-ai'
import { echo, scripted } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'

// Proves the attachment path end to end: files arrive through the button,
// a drop or a paste, wait in the strip (an oversize file lands there in its
// error state), can be removed, and become content parts of the sent message —
// the echo lists their MIME types.
function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(echo()))
  const chat = useChat({ fetcher })
  // 64 KiB instead of the 3 MiB default, so the over-limit error is easy to reach.
  const draft = useAttachmentDraft({ maxBytes: 64 * 1024 })
  return (
    <ChatShell
      chat={chat}
      empty="Attach an image or a PDF — pick, drop or paste — then send."
      attachments={<ComposerAttachments className="px-2" items={draft.items} onRemove={id => draft.remove(id)} />}
      toolbar={<ComposerAttach accept={draft.accept} multiple onFiles={files => draft.add(files)} />}
      onFiles={files => draft.add(files)}
      allowEmpty={draft.items.length > 0}
      onCommit={async (text) => {
        const parts = await draft.toParts()
        await chat.sendMessage(parts.length > 0 ? { content: [{ type: 'text', content: text }, ...parts] } : text)
        draft.clear()
      }}
    />
  )
}

export default function AttachmentsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
