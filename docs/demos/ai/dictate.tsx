import type { ReactElement } from 'react'
import { ComposerAttachments, ComposerDictate, useAttachmentDraft, useChat } from '@gedatou/cadenza-ai'
import { echo } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves dictation is just another attachment: the finished recording arrives
// as an `AudioPart`, joins the strip like a picked file, and ships with the
// next message — the echo lists its MIME type. Needs a microphone and the
// browser's permission; the button is disabled where recording is unsupported.
function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(echo()))
  const chat = useChat({ fetcher })
  const draft = useAttachmentDraft({ accept: ['audio'] })
  return (
    <ChatShell
      chat={chat}
      placeholder="Add a note to the recording…"
      empty="Press the microphone, speak, press it again to stop; the recording lands above the draft. Then send."
      attachments={<ComposerAttachments className="px-2" items={draft.items} onRemove={id => draft.remove(id)} />}
      toolbar={<ComposerDictate onRecording={part => draft.add([part])} />}
      allowEmpty={draft.items.length > 0}
      onCommit={async (text) => {
        const parts = await draft.toParts()
        await chat.sendMessage(parts.length > 0 ? { content: [{ type: 'text', content: text }, ...parts] } : text)
        draft.clear()
      }}
    />
  )
}

export default function DictateDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
