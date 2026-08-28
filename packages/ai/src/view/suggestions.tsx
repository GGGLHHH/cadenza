'use client'
import type { ButtonProps, ChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import { Button, cn, createChangeEventDetails, ScrollArea } from '@gedatou/cadenza-ui'
import { createContext, use, useMemo } from 'react'

export type SuggestionsChangeEventDetails = ChangeEventDetails<'item-press'>

export interface SuggestionsProps {
  /** The pressed chip's `value`. Values flow through the root, Base UI Menu / Select style. */
  onValueChange: (value: string, details: SuggestionsChangeEventDetails) => void
  children: ReactNode
  /** Lands on the `ScrollArea` root, a plain element. */
  className?: string
}

interface SuggestionsContextValue {
  onValueChange: SuggestionsProps['onValueChange']
}

const SuggestionsContext = createContext<SuggestionsContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  SuggestionsContext.displayName = 'SuggestionsContext'

function useSuggestionsContext(): SuggestionsContextValue {
  const context = use(SuggestionsContext)
  if (context === null)
    throw new Error('cadenza-ai: SuggestionsContext is missing. Suggestions parts must be placed within <Suggestions>.')
  return context
}

/** A horizontally scrolling row of prompt chips. */
export function Suggestions({ children, className, onValueChange }: SuggestionsProps): ReactElement {
  const context = useMemo<SuggestionsContextValue>(() => ({ onValueChange }), [onValueChange])
  return (
    <SuggestionsContext value={context}>
      <ScrollArea className={cn('inline-full', className)} orientation="horizontal">
        <div className="flex gap-2 inline-max" data-slot="suggestions" role="group">
          {children}
        </div>
      </ScrollArea>
    </SuggestionsContext>
  )
}

export type SuggestionsItemProps = Omit<ButtonProps, 'value'> & {
  /** What the root's `onValueChange` receives — usually the prompt text itself. */
  value: string
}

export function SuggestionsItem({ onClick, value, ...props }: SuggestionsItemProps): ReactElement {
  const { onValueChange } = useSuggestionsContext()
  return (
    <Button
      data-slot="suggestions-item"
      data-value={value}
      size="sm"
      variant="outline"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          onValueChange(value, createChangeEventDetails('item-press', event.nativeEvent))
      }}
    />
  )
}
