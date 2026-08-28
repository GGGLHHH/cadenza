'use client'
import type { ChangeEventDetails, CollapsibleChangeEventDetails, CollapsibleTriggerProps } from '@gedatou/cadenza-ui'
import type { ToolCallPart, ToolResultPart } from '@tanstack/ai/client'
import type { ReactElement, ReactNode } from 'react'
import type { AnyToolApprovalInterrupt } from '../runtime/renderers'
import { cn, Collapsible, CollapsiblePanel, CollapsibleTrigger, createChangeEventDetails, dataAttr, Spinner } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconClock, IconX } from '@tabler/icons-react'
import { parsePartialJSON } from '@tanstack/ai/client'
import { Children, useEffect, useEffectEvent, useRef } from 'react'
import { usePartRenderers } from '../runtime/renderers'
import { Markdown } from './markdown'

/** `trigger-press` from the user, `none` for programmatic changes. */
export type ToolCallChangeEventDetails = CollapsibleChangeEventDetails | ChangeEventDetails<'none'>

interface OpenProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ToolCallChangeEventDetails) => void
}

function useOpen({ open, defaultOpen, onOpenChange }: OpenProps, fallback = false): [boolean, (next: boolean, details: ToolCallChangeEventDetails) => void] {
  const [value, setValue] = useControllableState({ value: open, defaultValue: defaultOpen, fallback })
  return [value, (next, details) => {
    onOpenChange?.(next, details)
    if (!details.isCanceled)
      setValue(next)
  }]
}

export interface ToolCallCardProps extends OpenProps {
  part: ToolCallPart
  /** The matching `tool-result` part, once it exists. */
  result?: ToolResultPart
  /** The live approval interrupt while the call waits on the user. */
  interrupt?: AnyToolApprovalInterrupt
  streaming?: boolean
  /** Rendered at the end of the body — the place for `ApprovalActions`. */
  children?: ReactNode
  /** Lands on the Collapsible root. */
  className?: string
}

/** The seven `ToolCallState`s folded into five named attributes. */
export interface ToolCallCardState {
  pending: boolean
  approvalRequested: boolean
  approvalResponded: boolean
  complete: boolean
  error: boolean
}

// Failure is expected (arguments still streaming): the raw text is the fallback.
function parseJson(value: unknown): unknown {
  if (typeof value !== 'string')
    return value
  try {
    return parsePartialJSON(value) ?? value
  }
  catch {
    return value
  }
}

function jsonBlock(value: unknown): string {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
}

/**
 * A collapsible card for one tool call: header = tool name + state icon (no
 * words), body = the JSON input and output as Markdown code blocks, then
 * `children`.
 */
export function ToolCallCard({ part, result, interrupt: _interrupt, streaming = false, open: openProp, defaultOpen, onOpenChange, children, className }: ToolCallCardProps): ReactElement {
  const { labels } = usePartRenderers()
  const state: ToolCallCardState = {
    pending: part.state === 'awaiting-input' || part.state === 'input-streaming' || part.state === 'input-complete',
    approvalRequested: part.state === 'approval-requested',
    approvalResponded: part.state === 'approval-responded',
    complete: part.state === 'complete',
    error: part.state === 'error' || result?.state === 'error',
  }
  // A call waiting on the user opens itself (its approve / deny row lives in
  // the body) — once, and not over a reader who already folded it by hand.
  const [open, setOpen] = useOpen({ open: openProp, defaultOpen, onOpenChange }, state.approvalRequested)
  const manualRef = useRef(false)
  const requestedRef = useRef(state.approvalRequested)
  const openForApproval = useEffectEvent(() => {
    if (!manualRef.current)
      setOpen(true, createChangeEventDetails('none'))
  })
  useEffect(() => {
    const was = requestedRef.current
    requestedRef.current = state.approvalRequested
    if (state.approvalRequested && !was)
      openForApproval()
  }, [state.approvalRequested])
  // The header shows the state as an icon; the words go to assistive tech through `PartLabels`.
  const stateLabel = state.error
    ? labels.toolFailed
    : state.complete
      ? labels.toolDone
      : state.approvalRequested
        ? labels.toolApprovalRequested
        : state.approvalResponded
          ? (part.approval?.approved === false ? labels.toolDenied : labels.toolApproved)
          : part.state === 'input-complete' ? labels.toolRunning : labels.toolPending
  const input = part.input ?? (part.arguments === '' ? undefined : parseJson(part.arguments))
  const output: unknown = part.output ?? result?.content
  const error = result?.error

  return (
    <Collapsible
      data-slot="tool-call-card"
      data-pending={dataAttr(state.pending)}
      data-approval-requested={dataAttr(state.approvalRequested)}
      data-approval-responded={dataAttr(state.approvalResponded)}
      data-complete={dataAttr(state.complete)}
      data-error={dataAttr(state.error)}
      data-streaming={dataAttr(streaming)}
      open={open}
      onOpenChange={(next, details) => {
        manualRef.current = true
        setOpen(next, details)
      }}
      className={cn('rounded-lg border bg-card text-sm text-card-foreground', className)}
    >
      <CollapsibleTrigger
        data-slot="tool-call-card-trigger"
        className="
          flex items-center gap-2 px-3 py-2 text-start inline-full
          hover:bg-muted/50
        "
      >
        <span
          data-slot="tool-call-name"
          className="flex-1 truncate font-mono min-inline-0"
        >
          {part.name}
        </span>
        <span className="sr-only" data-slot="tool-call-state">{stateLabel}</span>
        {state.pending && (
          <Spinner
            aria-hidden
            className="block-[1em] inline-[1em]"
          />
        )}
        {state.approvalRequested && (
          <IconClock
            aria-hidden
            className="block-[1em] inline-[1em]"
          />
        )}
        {state.complete && (
          <IconCheck
            aria-hidden
            className="block-[1em] inline-[1em]"
          />
        )}
        {state.error && (
          <IconX
            aria-hidden
            className="text-destructive block-[1em] inline-[1em]"
          />
        )}
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="flex flex-col gap-2 border-bs px-3 py-2">
          {input !== undefined && <Markdown content={jsonBlock(input)} streaming={state.pending && streaming} />}
          {output !== undefined && <Markdown content={jsonBlock(parseJson(output))} />}
          {error !== undefined && (
            <p
              data-slot="tool-call-error"
              className="text-destructive"
            >
              {error}
            </p>
          )}
          {children}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  )
}

export interface ToolCallGroupProps extends OpenProps {
  count: number
  /** `ToolCallGroupTrigger` first, then the cards it folds. */
  children: ReactNode | ReactNode[]
  /** Lands on the Collapsible root. */
  className?: string
}

export type ToolCallGroupTriggerProps = CollapsibleTriggerProps

/** The group's title — a `CollapsibleTrigger`, wording from the caller. */
export function ToolCallGroupTrigger({ className, ...props }: ToolCallGroupTriggerProps): ReactElement {
  return (
    <CollapsibleTrigger
      data-slot="tool-call-group-trigger"
      className={cn(`text-sm text-muted-foreground`, className)}
      {...props}
    />
  )
}

/**
 * Folds a run of consecutive tool calls (spec G6). Position contract like
 * `DialogTrigger`: the first child is the `ToolCallGroupTrigger`, the rest
 * go into the panel.
 */
export function ToolCallGroup({ count, children, open: openProp, defaultOpen, onOpenChange, className }: ToolCallGroupProps): ReactElement {
  const [open, setOpen] = useOpen({ open: openProp, defaultOpen, onOpenChange })
  // eslint-disable-next-line react/no-children-to-array -- position contract (DialogTrigger style): the first child is the trigger
  const [trigger, ...body] = Children.toArray(children)
  return (
    <Collapsible
      data-slot="tool-call-group"
      data-count={count}
      open={open}
      onOpenChange={setOpen}
      // Spacing sits inside the panel so it folds with the cards (a `gap` on the
      // root would disappear in one step once the panel hides).
      className={cn('flex flex-col', className)}
    >
      {trigger}
      <CollapsiblePanel>
        <div className="flex flex-col gap-2 pbs-2">{body}</div>
      </CollapsiblePanel>
    </Collapsible>
  )
}
