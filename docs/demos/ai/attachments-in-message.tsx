import type { UIMessage } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { echo } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves MediaPart inside a user message: an image, a document and an audio
// part rendered by type — image card, document card with its name, a native
// audio player. The payloads are tiny inline data (a 1×1 PNG, an empty PDF,
// a 0.12 s tone) so the history needs no network.

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4FcEDAAN+AU+hW/ICAAAAAElFTkSuQmCC'
const PDF = 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+PgolJUVPRgo='
const WAV = 'UklGRuQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcADAACAob/W4uLXwqSDYUIrHhwmO1h5m7rS4OPaxqqJZ0cvHxwkN1JzlbXP3+Pcy7CPbU0yIRwhMk1tj7DL3OPfz7WVc1I3JBwfL0dniarG2uPg0rqbeVg7JhweK0Jhg6TC1+Li1r+hf15AKR0dKD1bfJ691OHj2cSnhmRFLR8cJTlVdpi40ODj28itjGpKMCAcIzRPcJKyzd7k3s2yknBPNCMcIDBKaoytyNvj4NC4mHZVOSUcHy1FZIanxNnj4dS9nnxbPSgdHSlAXoChv9bi4tfCpINhQiseHCY7WHmbutLg49rGqolnRy8fHCQ3UnOVtc/f49zLsI9tTTIhHCEyTW2PsMvc49/PtZVzUjckHB8vR2eJqsba4+DSupt5WDsmHB4rQmGDpMLX4uLWv6GAXkApHR0oPVt8nr3U4ePZxKeGZEUtHxwlOVV2mLjQ4OPbyK2MakowIBwjNE9wkrLN3uTezbKScE80IxwgMEpqjK3I2+Pg0LiYdlU5JRwfLUVkhqfE2ePh1L2efFs9KB0dKUBegKG/1uLi18Kkg2FCKx4cJjtYeZu60uDj2saqiWdHLx8cJDdSc5W1z9/j3Muwj21NMiEcITJNbY+wy9zj38+1lXNSNyQcHy9HZ4mqxtrj4NK6m3lYOyYcHitCYYOkwtfi4ta/oX9eQCkdHSg9W3yevdTh49nEp4ZkRS0fHCU5VXaYuNDg49vIrYxqSjAgHCM0T3CSss3e5N7NspJwTzQjHCAwSmqMrcjb4+DQuJh2VTklHB8tRWSGp8TZ4+HUvZ58Wz0oHR0pQF5/ob/W4uLXwqSDYUIrHhwmO1h5m7rS4OPaxqqJZ0cvHxwkN1JzlbXP3+Pcy7CPbU0yIRwhMk1tj7DL3OPfz7WVc1I3JBwfL0dniarG2uPg0rqbeVg7JhweK0Jhg6TC1+Li1r+hf15AKR0dKD1bfJ691OHj2cSnhmRFLR8cJTlVdpi40ODj28itjGpKMCAcIzRPcJKyzd7k3s2yknBPNCMcIDBKaoytyNvj4NC4mHZVOSUcHy1FZIanxNnj4dS9nnxbPSgdHSlAXoChv9bi4tfCpINhQiseHCY7WHmbutLg49rGqolnRy8fHCQ3UnOVtc/f49zLsI9tTTIhHCEyTW2PsMvc49/PtZVzUjckHB8vR2eJqsba4+DSupt5WDsmHB4rQmGDpMLX4uLWv6F/XkApHR0oPVt8nr3U4ePZxKeGZEUtHxwlOVV2mLjQ4OPbyK2MakowIBwjNE9wkrLN3uTezbKScE80Ixw='

const history: UIMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    parts: [
      { type: 'text', content: 'Here is the poster, the running order and the tuning note.' },
      { type: 'image', source: { type: 'data', value: PNG, mimeType: 'image/png' }, metadata: { name: 'poster.png' } },
      { type: 'document', source: { type: 'data', value: PDF, mimeType: 'application/pdf' }, metadata: { name: 'running-order.pdf' } },
      { type: 'audio', source: { type: 'data', value: WAV, mimeType: 'audio/wav' } },
    ],
  },
]

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(echo()))
  const chat = useChat({ fetcher, initialMessages: history })
  return <ChatShell chat={chat} />
}

export default function AttachmentsInMessageDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
