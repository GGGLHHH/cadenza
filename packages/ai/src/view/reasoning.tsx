'use client'
import type { ChangeEventDetails, CollapsibleChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import { cn, Collapsible, CollapsiblePanel, CollapsibleTrigger, createChangeEventDetails, dataAttr, Marker, MarkerContent } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Markdown } from './markdown'

/** `trigger-press` from the user, `none` for the automatic collapse on completion. */
export type ReasoningChangeEventDetails = CollapsibleChangeEventDetails | ChangeEventDetails<'none'>

export interface ReasoningProps {
  content: string
  complete: boolean
  /** `Date.now()` when the thinking started. Default: when this part mounted, which is when it arrived. */
  startedAt?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ReasoningChangeEventDetails) => void
  /** The trigger's text ("Thinking…" / "Thought for 3s") — the part ships none. */
  children: ReactNode
  /** Lands on the Collapsible root. */
  className?: string
}

export interface ReasoningState {
  complete: boolean
  open: boolean
}

function elapsedSeconds(complete: boolean, startedAt: number): number | undefined {
  // Floor at one second: "Thought for 0s" is what a fast run would otherwise say.
  return complete ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : undefined
}

/**
 * A thinking block: open while streaming (shimmering trigger), folds itself
 * once when `complete` flips — unless the user has already toggled it by hand.
 */
export function Reasoning({ content, complete, startedAt: startedAtProp, open: openProp, defaultOpen, onOpenChange, children, className }: ReasoningProps): ReactElement {
  // `!complete` only seeds the very first render (fallback, not defaultValue):
  // the state hook warns when an uncontrolled default changes after mount.
  const [open, setOpenState] = useControllableState({ value: openProp, defaultValue: defaultOpen, fallback: !complete })
  const manualRef = useRef(false)
  const completeRef = useRef(complete)
  // The part mounts when it arrives, so mount time is when thinking started.
  const [startedAt] = useState(() => startedAtProp ?? Date.now())
  // Elapsed seconds, fixed at the moment `complete` flips (or at mount for a
  // part that arrives already complete) — the trigger shows them as data.
  const [seconds, setSeconds] = useState(() => elapsedSeconds(complete, startedAt))

  const setOpen = (next: boolean, details: ReasoningChangeEventDetails): void => {
    onOpenChange?.(next, details)
    if (details.isCanceled)
      return
    setOpenState(next)
  }

  const onComplete = useEffectEvent(() => {
    setSeconds(elapsedSeconds(true, startedAt))
    if (!manualRef.current)
      setOpen(false, createChangeEventDetails('none'))
  })
  useEffect(() => {
    const was = completeRef.current
    completeRef.current = complete
    if (complete && !was)
      onComplete()
  }, [complete])

  return (
    <Collapsible
      data-slot="reasoning"
      data-complete={dataAttr(complete)}
      data-open={dataAttr(open)}
      open={open}
      onOpenChange={(next, details) => {
        manualRef.current = true
        setOpen(next, details)
      }}
      className={cn('flex flex-col gap-2', className)}
    >
      {/* Marker gives the row its look; the trigger stays a real <button> for keyboard and aria-expanded. */}
      <CollapsibleTrigger data-slot="reasoning-trigger" render={<Marker render={<button type="button" />} />}>
        <MarkerContent className={complete ? undefined : 'shimmer'}>
          {children}
          {seconds !== undefined && (
            <span data-slot="reasoning-duration">
              {seconds}
              s
            </span>
          )}
        </MarkerContent>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Markdown
          content={content}
          streaming={!complete}
          className="text-sm text-muted-foreground"
        />
      </CollapsiblePanel>
    </Collapsible>
  )
}
