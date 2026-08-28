'use client'
import type { ChatClientState, ComposerProps, MultimodalContent, TranscriptProviderProps, UIMessage } from '@gedatou/cadenza-ai'
import type { ReactElement, ReactNode } from 'react'
import {
  Composer,
  ComposerSubmit,
  ComposerTextarea,
  ComposerToolbar,
  Transcript,
  TranscriptActions,
  TranscriptEmpty,
  TranscriptError,
  TranscriptMessage,
  TranscriptParts,
  TranscriptPending,
  TranscriptProvider,
} from '@gedatou/cadenza-ai'
import { Kbd } from '@gedatou/cadenza-ui'

// The slice of useChat() the shell reads. Structural rather than UseChatReturn
// because that type is generic over the tool set (its `interrupts` differ per
// tool), and a shell shared by every demo must take all of them.
export interface ChatShellChat {
  messages: readonly UIMessage[]
  status: ChatClientState
  error: Error | undefined
  interrupts: TranscriptProviderProps['interrupts']
  addToolApprovalResponse: TranscriptProviderProps['addToolApprovalResponse']
  sendMessage: (content: string | MultimodalContent) => Promise<void>
  stop: () => void
}

export interface ChatShellProps {
  chat: ChatShellChat
  placeholder?: string
  /** Controlled draft: pair with `onValueChange` to keep the text outside the composer (drafts per thread). */
  value?: string
  onValueChange?: ComposerProps['onValueChange']
  /** Shown while the transcript is empty (the `TranscriptEmpty` children). */
  empty?: ReactNode
  /** A row inside the frame above the transcript, outside the scrolling list (paging controls). */
  before?: ReactNode
  /** Toolbar contents for each assistant row. */
  renderActions?: (message: UIMessage) => ReactNode
  /** Extra controls before the submit button. */
  toolbar?: ReactNode
  /** The pending-attachments strip, above the textarea. */
  attachments?: ReactNode
  /** Files dropped on or pasted into the composer. */
  onFiles?: ComposerProps['onFiles']
  /** Let an empty draft go out — when the attachments strip carries the content. */
  allowEmpty?: boolean
  /** Edit-and-resend: the composer opens with `text` and Escape cancels. */
  editing?: { id: string, text: string } | null
  onEditCancel?: () => void
  /** Default: `chat.sendMessage(text)`. */
  onCommit?: (text: string) => void | Promise<void>
  className?: string
}

// The one composition every demo shares: transcript above, composer below.
// Demos differ only in the script they feed useChat and the slots they fill.
export function ChatShell({
  chat,
  placeholder = 'Ask about the programme…',
  value,
  onValueChange,
  empty,
  before,
  renderActions,
  toolbar,
  attachments,
  onFiles,
  allowEmpty,
  editing = null,
  onEditCancel,
  onCommit,
  className = 'block-120',
}: ChatShellProps): ReactElement {
  const last = chat.messages.at(-1)
  return (
    <TranscriptProvider status={chat.status} interrupts={chat.interrupts} addToolApprovalResponse={chat.addToolApprovalResponse}>
      <div className={`
        flex flex-col rounded-xl border
        ${className}
      `}
      >
        {before}
        <Transcript>
          {chat.messages.length === 0 && empty !== undefined && <TranscriptEmpty>{empty}</TranscriptEmpty>}
          {chat.messages.map(message => (
            <TranscriptMessage key={message.id} message={message} streaming={chat.status === 'streaming' && message === last}>
              <TranscriptParts message={message} />
              {message.role === 'assistant' && renderActions !== undefined && (
                <TranscriptActions>{renderActions(message)}</TranscriptActions>
              )}
            </TranscriptMessage>
          ))}
          {chat.status === 'submitted' && <TranscriptPending>Thinking…</TranscriptPending>}
          {chat.error !== undefined && <TranscriptError error={chat.error}>{chat.error.message}</TranscriptError>}
        </Transcript>
        <Composer
          key={editing?.id ?? 'new'}
          status={chat.status}
          editing={editing !== null}
          defaultValue={editing?.text}
          value={value}
          onValueChange={onValueChange}
          onValueCommitted={(text) => {
            void Promise.resolve(onCommit ? onCommit(text) : chat.sendMessage(text)).catch((error: unknown) => {
              // A missing key rejects sendMessage while the client raises its prompt (the key dialog opens); nothing to do here.
              if (!(error instanceof Error && error.name === 'ByokBlockedError'))
                throw error
            })
          }}
          onStop={() => chat.stop()}
          onEditCancel={onEditCancel}
          onFiles={onFiles}
          allowEmpty={allowEmpty}
          className="border-bs p-2"
        >
          {attachments}
          <ComposerTextarea placeholder={placeholder} />
          <ComposerToolbar>
            {toolbar}
            <span className="ms-auto text-xs text-muted-foreground">
              <Kbd>↵</Kbd>
              {' '}
              send
            </span>
            <ComposerSubmit />
          </ComposerToolbar>
        </Composer>
      </div>
    </TranscriptProvider>
  )
}
