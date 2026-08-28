import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { custom, scripted, sleep, text } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'

// Proves `onCustomEvent`: the script emits three `progress` events before its
// text, and the callback drives a native progress bar above the shell.

interface Progress { done: number, total: number }

function isProgress(data: unknown): data is Progress {
  return typeof data === 'object' && data !== null && 'done' in data && 'total' in data
}

function Body(): ReactElement {
  const [fetcher] = useState(() => scripted(() => [
    custom('progress', { done: 1, total: 3 }),
    sleep(300),
    custom('progress', { done: 2, total: 3 }),
    sleep(300),
    custom('progress', { done: 3, total: 3 }),
    text('Parts checked.'),
  ]))
  const [progress, setProgress] = useState<Progress | null>(null)
  const chat = useChat({
    fetcher,
    onCustomEvent: (name, data) => {
      if (name === 'progress' && isProgress(data))
        setProgress(data)
    },
  })
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Checking parts
        <progress
          value={progress?.done ?? 0}
          max={progress?.total ?? 3}
          className="flex-1"
        />
        {progress !== null && `${progress.done}/${progress.total}`}
      </label>
      <ChatShell chat={chat} empty="Ask to check the parts." />
    </div>
  )
}

export default function CustomEventsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
