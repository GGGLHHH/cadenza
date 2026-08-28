'use client'
import type { ChangeEventDetails, CollapsibleChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import type { Source } from '../runtime/messages'
import { cn, Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'

export type SourcesChangeEventDetails = CollapsibleChangeEventDetails | ChangeEventDetails<'none'>

export interface SourcesProps {
  sources: readonly Source[]
  /** The trigger's text ("3 sources") — the part ships none. */
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: SourcesChangeEventDetails) => void
  /** Lands on the Collapsible root. */
  className?: string
}

/** The links a provider-executed search returned (spec T12), folded behind a trigger. */
export function Sources({ sources, children, open: openProp, defaultOpen, onOpenChange, className }: SourcesProps): ReactElement {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, fallback: false })
  return (
    <Collapsible
      data-slot="sources"
      data-count={sources.length}
      open={open}
      onOpenChange={(next, details) => {
        onOpenChange?.(next, details)
        if (!details.isCanceled)
          setOpen(next)
      }}
      className={cn('flex flex-col gap-2 text-sm', className)}
    >
      <CollapsibleTrigger
        data-slot="sources-trigger"
        className="text-muted-foreground"
      >
        {children}
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <ol className="flex list-decimal flex-col gap-1 ps-5">
          {sources.map(source => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {source.title ?? source.url}
              </a>
              {source.snippet !== undefined && (
                <p className="text-muted-foreground">
                  {source.snippet}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CollapsiblePanel>
    </Collapsible>
  )
}
