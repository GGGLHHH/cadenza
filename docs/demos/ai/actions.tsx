import type { UIMessage } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { editAndResend, messageText, TranscriptAction, useChat, useStoredState } from '@gedatou/cadenza-ai'
import { CopyIcon, PencilIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon, TrashIcon, Volume2Icon } from '@gedatou/cadenza-icons'
import { useState, useSyncExternalStore } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { rehearsalScript } from './scripts'
import { getTime } from './tools'

// Proves the per-row toolbar: Copy takes the message text, Regenerate replays
// the last turn, Edit reopens the user message before this reply (Escape
// cancels; committing truncates from there and resends), Clear empties the
// thread, thumbs up / down toggle a verdict the host stores (`aria-pressed`
// on the button, `useStoredState` in localStorage) and Read aloud hands the
// text to `speechSynthesis` — disabled where the browser has none. The bar
// is `data-hidden` while a run streams.
const FEEDBACK_KEY = 'docs-feedback'
type Verdict = 'up' | 'down'

const noSubscribe = (): (() => void) => () => {}

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(rehearsalScript()))
  const chat = useChat({ fetcher, tools: [getTime] })
  const [editing, setEditing] = useState<{ id: string, text: string } | null>(null)
  const [feedback, setFeedback] = useStoredState<Record<string, Verdict>>(FEEDBACK_KEY, {})
  // Server snapshot is false so the markup hydrates identically; the client
  // snapshot answers through.
  const canSpeak = useSyncExternalStore(noSubscribe, () => 'speechSynthesis' in window, () => false)

  const edit = (message: UIMessage): void => {
    const index = chat.messages.findIndex(m => m.id === message.id)
    const user = chat.messages.slice(0, index).findLast(m => m.role === 'user')
    if (user)
      setEditing({ id: user.id, text: messageText(user) })
  }

  const rate = (message: UIMessage, verdict: Verdict): void => {
    const { [message.id]: current, ...rest } = feedback
    setFeedback(current === verdict ? rest : { ...rest, [message.id]: verdict })
  }

  const speak = (message: UIMessage): void => {
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(messageText(message)))
  }

  return (
    <ChatShell
      chat={chat}
      empty="Try: “Plan the programme.”"
      editing={editing}
      onEditCancel={() => setEditing(null)}
      onCommit={async (text) => {
        if (editing === null) {
          await chat.sendMessage(text)
          return
        }
        const { id } = editing
        setEditing(null)
        await editAndResend(chat, id, text)
      }}
      renderActions={message => (
        <>
          <TranscriptAction aria-label="Copy" onClick={() => void navigator.clipboard.writeText(messageText(message))}>
            <CopyIcon animateOnHover />
          </TranscriptAction>
          {message.id === chat.messages.at(-1)?.id && (
            <TranscriptAction aria-label="Regenerate" onClick={() => void chat.reload()}>
              <RefreshCwIcon animateOnHover />
            </TranscriptAction>
          )}
          <TranscriptAction aria-label="Edit" onClick={() => edit(message)}>
            <PencilIcon animateOnHover />
          </TranscriptAction>
          <TranscriptAction aria-label="Good response" aria-pressed={feedback[message.id] === 'up'} onClick={() => rate(message, 'up')}>
            <ThumbsUpIcon animateOnHover />
          </TranscriptAction>
          <TranscriptAction aria-label="Bad response" aria-pressed={feedback[message.id] === 'down'} onClick={() => rate(message, 'down')}>
            <ThumbsDownIcon animateOnHover />
          </TranscriptAction>
          <TranscriptAction aria-label="Read aloud" disabled={!canSpeak} onClick={() => speak(message)}>
            <Volume2Icon animateOnHover />
          </TranscriptAction>
          <TranscriptAction aria-label="Clear" onClick={() => chat.clear()}>
            <TrashIcon animateOnHover />
          </TranscriptAction>
        </>
      )}
    />
  )
}

export default function ActionsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl" onReset={() => localStorage.removeItem(FEEDBACK_KEY)}>
      <Body />
    </ResettableDemo>
  )
}
