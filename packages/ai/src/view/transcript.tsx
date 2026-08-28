'use client'
import type { ButtonProps, EmptyProps, MessageAlign, MessageScrollerDefaultScrollPosition, MessageScrollerViewportProps } from '@gedatou/cadenza-ui'
import type { ChatClientState, ChatInterrupt, UIMessage } from '@tanstack/ai-client'
import type { ToolCallPart, ToolResultPart } from '@tanstack/ai/client'
import type { MemoExoticComponent, ReactElement, ReactNode } from 'react'
import type { AnyToolApprovalInterrupt } from '../runtime/renderers'
import {
  Bubble,
  BubbleContent,
  Button,
  cn,
  dataAttr,
  Empty,
  Marker,
  MarkerContent,
  Message,
  MessageContent,
  MessageFooter,
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@gedatou/cadenza-ui'
import { Children, createContext, isValidElement, memo, use, useMemo } from 'react'
import { isThinkingComplete, sourcesOf } from '../runtime/messages'
import { usePartRenderers } from '../runtime/renderers'
import { ApprovalActions, ApprovalApprove, ApprovalDeny } from './approval'
import { Markdown } from './markdown'
import { MediaPart } from './media-part'
import { Reasoning } from './reasoning'
import { Sources } from './sources'
import { StructuredOutput } from './structured-output'
import { ToolCallCard, ToolCallGroup, ToolCallGroupTrigger } from './tool-call'

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

export interface ApprovalResponseInput {
  id: string
  approved: boolean
}

/**
 * `ChatInterrupt`'s default generic folds the approval member away, and the
 * per-tool `ToolApprovalInterrupt<T>` instantiations do not unify (see
 * `AnyToolApprovalInterrupt`), so the transcript names the union itself.
 */
export type TranscriptInterrupt = ChatInterrupt | AnyToolApprovalInterrupt

export interface TranscriptContextValue {
  status: ChatClientState
  interrupts: readonly TranscriptInterrupt[]
  /** Fallback for `approval-requested` parts that carry no live interrupt (e.g. restored history). */
  addToolApprovalResponse?: (input: ApprovalResponseInput) => Promise<void> | void
}

const TranscriptContext = createContext<TranscriptContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  TranscriptContext.displayName = 'TranscriptContext'

export interface TranscriptProviderProps {
  status: ChatClientState
  interrupts?: readonly TranscriptInterrupt[]
  addToolApprovalResponse?: TranscriptContextValue['addToolApprovalResponse']
  children: ReactNode
}

const NO_INTERRUPTS: readonly TranscriptInterrupt[] = []

/** Hands `useChat()`'s run state to every Transcript part below it. */
export function TranscriptProvider({ status, interrupts = NO_INTERRUPTS, addToolApprovalResponse, children }: TranscriptProviderProps): ReactElement {
  const value = useMemo<TranscriptContextValue>(() => ({ status, interrupts, addToolApprovalResponse }), [status, interrupts, addToolApprovalResponse])
  return <TranscriptContext value={value}>{children}</TranscriptContext>
}

export function useTranscript(): TranscriptContextValue {
  const value = use(TranscriptContext)
  if (value === null)
    throw new Error('cadenza-ai: TranscriptContext is missing. Transcript parts must be placed within <TranscriptProvider>.')
  return value
}

/* -------------------------------------------------------------------------- */
/* Transcript                                                                  */
/* -------------------------------------------------------------------------- */

export interface TranscriptProps extends Omit<MessageScrollerViewportProps, 'className' | 'children'> {
  children: ReactNode
  /** Follow new messages while the reader is at the end. Default true. */
  autoScroll?: boolean
  /** Where a freshly mounted transcript rests. Default `'end'`. */
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition
  /** Lands on the scroller frame. */
  className?: string
}

/** The scrolling frame: `MessageScroller` with the house viewport, one row per `TranscriptMessage`. */
export function Transcript({ children, autoScroll = true, defaultScrollPosition = 'end', className, ...viewport }: TranscriptProps): ReactElement {
  useTranscript()
  return (
    <MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition={defaultScrollPosition}>
      <MessageScroller
        data-slot="transcript"
        className={cn(`flex flex-1 flex-col min-block-0`, className)}
      >
        <MessageScrollerViewport {...viewport}>
          <MessageScrollerContent className="flex flex-col gap-6 p-4">{children}</MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

/* -------------------------------------------------------------------------- */
/* TranscriptMessage                                                           */
/* -------------------------------------------------------------------------- */

export interface TranscriptMessageProps {
  message: UIMessage
  /** Default: user rows end-aligned, everything else start-aligned. */
  align?: MessageAlign
  /** True for the row the current run is writing into. */
  streaming?: boolean
  /** Default: `<TranscriptParts message={message} />`. A `TranscriptActions` child is lifted into the footer. */
  children?: ReactNode
  className?: string
}

export interface TranscriptMessageState {
  role: string
  streaming: boolean
}

function TranscriptMessageImpl({ message, align, streaming = false, children, className }: TranscriptMessageProps): ReactElement {
  const user = message.role === 'user'
  const parts: ReactNode[] = []
  const actions: ReactNode[] = []
  // eslint-disable-next-line react/no-children-for-each -- lift contract: a TranscriptActions child moves from the bubble to the footer
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TranscriptActions)
      actions.push(child)
    else if (child !== null && child !== undefined && child !== false)
      parts.push(child)
  })
  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={user}
      data-slot="transcript-message"
      data-role={message.role}
      data-streaming={dataAttr(streaming)}
      className={className}
    >
      <Message align={align ?? (user ? 'end' : 'start')}>
        <MessageContent>
          {/* Bubble shrink-wraps its content; an assistant reply is prose plus cards, and a card must
              not widen as the text behind it streams in — so those rows take the full width up front. */}
          <Bubble
            variant={user ? 'muted' : 'ghost'}
            className={user
              ? undefined
              : `min-inline-full`}
          >
            <BubbleContent className={user ? undefined : 'min-inline-full'}>{parts.length > 0 ? parts : <TranscriptParts message={message} />}</BubbleContent>
          </Bubble>
          {actions}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}

/** One row. Memoised so a streaming row re-renders alone. */
export const TranscriptMessage: MemoExoticComponent<typeof TranscriptMessageImpl> = memo(TranscriptMessageImpl)
if (process.env.NODE_ENV !== 'production')
  TranscriptMessage.displayName = 'TranscriptMessage'

/* -------------------------------------------------------------------------- */
/* TranscriptParts                                                             */
/* -------------------------------------------------------------------------- */

export interface TranscriptPartsProps {
  message: UIMessage
  className?: string
}

function isApproval(interrupt: TranscriptInterrupt): interrupt is AnyToolApprovalInterrupt {
  return interrupt.kind === 'tool-approval'
}

/** Dispatches every part of a message through the renderer registry and the default parts. */
export function TranscriptParts({ message, className }: TranscriptPartsProps): ReactElement {
  const { renderers, labels } = usePartRenderers()
  const { status, interrupts, addToolApprovalResponse } = useTranscript()
  const results = useMemo(() => {
    const map = new Map<string, ToolResultPart>()
    for (const part of message.parts) {
      if (part.type === 'tool-result')
        map.set(part.toolCallId, part)
    }
    return map
  }, [message.parts])
  const lastIndex = message.parts.length - 1

  const renderTool = (part: ToolCallPart, index: number): ReactNode => {
    const result = results.get(part.id)
    const interrupt = interrupts.filter(isApproval).find(i => i.toolCallId === part.id)
    const streaming = status === 'streaming' && index === lastIndex
    const custom = renderers.toolCall?.[part.name] ?? renderers.toolCall?.default
    if (custom)
      return custom({ part, result, interrupt, streaming })
    let approval: ReactNode = null
    if (part.state === 'approval-requested') {
      if (interrupt) {
        approval = (
          <ApprovalActions interrupt={interrupt}>
            <ApprovalApprove>{labels.approve}</ApprovalApprove>
            <ApprovalDeny>{labels.deny}</ApprovalDeny>
          </ApprovalActions>
        )
      }
      else if (part.approval && addToolApprovalResponse) {
        const id = part.approval.id
        approval = (
          <div role="group" data-slot="approval-actions" className="flex gap-2">
            <Button size="sm" onClick={() => void addToolApprovalResponse({ id, approved: true })}>{labels.approve}</Button>
            <Button size="sm" variant="outline" onClick={() => void addToolApprovalResponse({ id, approved: false })}>{labels.deny}</Button>
          </div>
        )
      }
    }
    return <ToolCallCard part={part} result={result} interrupt={interrupt} streaming={streaming}>{approval}</ToolCallCard>
  }

  const nodes: ReactNode[] = []
  let index = 0
  while (index <= lastIndex) {
    const part = message.parts[index]
    if (part.type === 'tool-call') {
      // Consecutive tool calls (results interleaved) collapse into one group.
      const run: Array<[ToolCallPart, number]> = []
      let cursor = index
      while (cursor <= lastIndex) {
        const next = message.parts[cursor]
        if (next.type === 'tool-call')
          run.push([next, cursor])
        else if (next.type !== 'tool-result')
          break
        cursor += 1
      }
      const cards = run.map(([p, i]) => <div key={p.id}>{renderTool(p, i)}</div>)
      nodes.push(run.length > 1
        ? (
            <ToolCallGroup key={`group-${index}`} count={run.length}>
              <ToolCallGroupTrigger>{labels.toolGroup(run.length)}</ToolCallGroupTrigger>
              {cards}
            </ToolCallGroup>
          )
        : cards[0])
      index = cursor
      continue
    }
    const key = `${part.type}-${index}`
    switch (part.type) {
      case 'text': {
        const streaming = status === 'streaming' && index === lastIndex
        nodes.push(<div key={key}>{renderers.text ? renderers.text({ part, message, streaming }) : <Markdown content={part.content} streaming={streaming} />}</div>)
        break
      }
      case 'thinking': {
        const complete = isThinkingComplete(message, index, status)
        // Reasoning times itself from mount; the label is copy, the seconds are its data.
        nodes.push((
          <div key={key}>
            {renderers.thinking
              ? renderers.thinking({ part, complete })
              : (
                  <Reasoning content={part.content} complete={complete}>
                    {complete ? labels.thought : labels.thinking}
                  </Reasoning>
                )}
          </div>
        ))
        break
      }
      case 'tool-result':
        if (renderers.toolResult)
          nodes.push(<div key={key}>{renderers.toolResult({ part })}</div>)
        break
      case 'image':
        nodes.push(<div key={key}>{renderers.image ? renderers.image({ part, message }) : <MediaPart part={part} />}</div>)
        break
      case 'audio':
        nodes.push(<div key={key}>{renderers.audio ? renderers.audio({ part, message }) : <MediaPart part={part} />}</div>)
        break
      case 'video':
        nodes.push(<div key={key}>{renderers.video ? renderers.video({ part, message }) : <MediaPart part={part} />}</div>)
        break
      case 'document':
        nodes.push(<div key={key}>{renderers.document ? renderers.document({ part, message }) : <MediaPart part={part} />}</div>)
        break
      case 'structured-output':
        nodes.push(<div key={key}>{renderers.structuredOutput ? renderers.structuredOutput({ part }) : <StructuredOutput part={part} />}</div>)
        break
      case 'ui-resource':
        if (renderers.uiResource)
          nodes.push(<div key={key}>{renderers.uiResource({ part })}</div>)
        break
      default:
        break
    }
    index += 1
  }

  const sources = sourcesOf(message)
  return (
    <div data-slot="transcript-parts" className={cn('flex flex-col gap-3', className)}>
      {nodes}
      {sources.length > 0 && <Sources sources={sources}>{labels.sources(sources.length)}</Sources>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Actions / Empty / Pending / Error                                           */
/* -------------------------------------------------------------------------- */

export interface TranscriptActionsProps {
  children: ReactNode
  className?: string
}

/** The row's toolbar, hidden while a run streams. Place it as a child of `TranscriptMessage`. */
export function TranscriptActions({ children, className }: TranscriptActionsProps): ReactElement {
  const { status } = useTranscript()
  return (
    <MessageFooter>
      <div
        role="toolbar"
        data-slot="transcript-actions"
        data-hidden={dataAttr(status === 'streaming')}
        className={cn(`
          flex items-center gap-1
          data-hidden:invisible
        `, className)}
      >
        {children}
      </div>
    </MessageFooter>
  )
}

export type TranscriptActionProps = ButtonProps

export function TranscriptAction({ className, ...props }: TranscriptActionProps): ReactElement {
  return <Button variant="ghost" size="icon-xs" data-slot="transcript-action" className={className} {...props} />
}

export type TranscriptEmptyProps = EmptyProps

export function TranscriptEmpty(props: TranscriptEmptyProps): ReactElement {
  return <Empty data-slot="transcript-empty" {...props} />
}

export interface TranscriptPendingProps {
  children: ReactNode
  className?: string
}

/** Shown between submit and the first chunk. */
export function TranscriptPending({ children, className }: TranscriptPendingProps): ReactElement {
  return (
    <Marker role="status" data-slot="transcript-pending" className={className}>
      <MarkerContent className="shimmer">{children}</MarkerContent>
    </Marker>
  )
}

export interface TranscriptErrorProps {
  error: Error
  children: ReactNode
  className?: string
}

export function TranscriptError({ error, children, className }: TranscriptErrorProps): ReactElement {
  const code = (error as { code?: unknown }).code
  return (
    <div
      role="alert"
      data-slot="transcript-error"
      data-code={typeof code === 'string' ? code : undefined}
      className={cn(`
        rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2
        text-sm text-destructive
      `, className)}
    >
      {children}
    </div>
  )
}
