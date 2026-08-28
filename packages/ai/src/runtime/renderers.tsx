'use client'
import type { InterruptItemStatus, UIMessage } from '@tanstack/ai-client'
import type { AudioPart, DocumentPart, ImagePart, StructuredOutputPart, TextPart, ThinkingPart, ToolCallPart, ToolResultPart, UIResourcePart, VideoPart } from '@tanstack/ai/client'
import type { ReactElement, ReactNode } from 'react'
import { createContext, use, useMemo } from 'react'

/** Every visible string the default part renderers emit. Override through `PartRenderersProvider`. */
export interface PartLabels {
  thinking: string
  /** Precedes the elapsed seconds `Reasoning` renders as data ("Thought for" → "Thought for 3s"). */
  thought: string
  toolPending: string
  toolRunning: string
  toolApprovalRequested: string
  toolApproved: string
  toolDenied: string
  toolDone: string
  toolFailed: string
  toolGroup: (count: number) => string
  approve: string
  deny: string
  sources: (count: number) => string
}

export const DEFAULT_PART_LABELS: PartLabels = {
  thinking: 'Thinking…',
  thought: 'Thought for ',
  toolPending: 'Preparing',
  toolRunning: 'Running',
  toolApprovalRequested: 'Needs approval',
  toolApproved: 'Approved',
  toolDenied: 'Denied',
  toolDone: 'Done',
  toolFailed: 'Failed',
  toolGroup: count => `Ran ${count} tools`,
  approve: 'Approve',
  deny: 'Deny',
  sources: count => `${count} sources`,
}

/**
 * The approval interrupt as the views see it, for whichever tool set the chat
 * was created with. `useChat().interrupts` is typed per tool and
 * `ToolApprovalInterrupt<T>` is contravariant in `T` through `resolveInterrupt`,
 * so no instantiation accepts every other one; this structural type lists only
 * what the views read, with `resolveInterrupt` as a method (bivariant on
 * purpose) so any tool's interrupt flows in untouched.
 */
export interface AnyToolApprovalInterrupt {
  readonly kind: 'tool-approval'
  readonly toolCallId: string
  readonly toolName: string
  readonly originalArgs: unknown
  readonly status: InterruptItemStatus
  // eslint-disable-next-line ts/method-signature-style -- bivariance: see above
  resolveInterrupt(approved: boolean, options?: { editedArgs?: unknown }): void
}

export interface ToolRendererProps {
  part: ToolCallPart
  /** The matching `tool-result` part of the same message, once it exists. */
  result: ToolResultPart | undefined
  /** The live approval interrupt while the call waits on the user. */
  interrupt: AnyToolApprovalInterrupt | undefined
  streaming: boolean
}

export type ToolRenderer = (props: ToolRendererProps) => ReactNode

/** Per-part-type overrides; anything omitted falls back to the built-in renderer. */
export interface PartRenderers {
  text?: (props: { part: TextPart, message: UIMessage, streaming: boolean }) => ReactNode
  thinking?: (props: { part: ThinkingPart, complete: boolean }) => ReactNode
  /** Keyed by tool name; `default` catches the rest. */
  toolCall?: { default?: ToolRenderer } & Record<string, ToolRenderer | undefined>
  toolResult?: (props: { part: ToolResultPart }) => ReactNode
  image?: (props: { part: ImagePart, message: UIMessage }) => ReactNode
  audio?: (props: { part: AudioPart, message: UIMessage }) => ReactNode
  video?: (props: { part: VideoPart, message: UIMessage }) => ReactNode
  document?: (props: { part: DocumentPart, message: UIMessage }) => ReactNode
  structuredOutput?: (props: { part: StructuredOutputPart }) => ReactNode
  uiResource?: (props: { part: UIResourcePart }) => ReactNode
}

/** Identity with a type check, so a registry can be declared outside a component. */
export function definePartRenderers(renderers: PartRenderers): PartRenderers {
  return renderers
}

export interface PartRenderersContextValue {
  renderers: PartRenderers
  labels: PartLabels
}

const DEFAULT_VALUE: PartRenderersContextValue = { renderers: {}, labels: DEFAULT_PART_LABELS }

// Optional context: reading it without a provider yields the complete defaults.
const PartRenderersContext = createContext<PartRenderersContextValue>(DEFAULT_VALUE)
if (process.env.NODE_ENV !== 'production')
  PartRenderersContext.displayName = 'PartRenderersContext'

export interface PartRenderersProviderProps {
  renderers?: PartRenderers
  labels?: Partial<PartLabels>
  children: ReactNode
}

export function PartRenderersProvider({ renderers, labels, children }: PartRenderersProviderProps): ReactElement {
  const parent = use(PartRenderersContext)
  const value = useMemo<PartRenderersContextValue>(() => ({
    renderers: renderers ?? parent.renderers,
    labels: labels ? { ...parent.labels, ...labels } : parent.labels,
  }), [renderers, labels, parent])
  return <PartRenderersContext value={value}>{children}</PartRenderersContext>
}

export function usePartRenderers(): PartRenderersContextValue {
  return use(PartRenderersContext)
}
