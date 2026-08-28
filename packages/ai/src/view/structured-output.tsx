'use client'
import type { StructuredOutputPart } from '@tanstack/ai/client'
import type { ReactElement } from 'react'
import { cn, dataAttr, Spinner } from '@gedatou/cadenza-ui'
import { Markdown } from './markdown'

export interface StructuredOutputProps {
  part: StructuredOutputPart
  className?: string
}

function jsonBlock(value: unknown): string {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
}

/** `useChat({ outputSchema })`'s part (spec T23): partial JSON while streaming, the validated data once complete. */
export function StructuredOutput({ part, className }: StructuredOutputProps): ReactElement {
  const streaming = part.status === 'streaming'
  return (
    <div
      data-slot="structured-output"
      data-streaming={dataAttr(streaming)}
      data-complete={dataAttr(part.status === 'complete')}
      data-error={dataAttr(part.status === 'error')}
      className={cn('flex flex-col gap-2', className)}
    >
      {streaming && (
        <>
          <Markdown content={jsonBlock(part.partial)} streaming />
          <Spinner aria-hidden className="block-[1em] inline-[1em]" />
        </>
      )}
      {part.status === 'complete' && <Markdown content={jsonBlock(part.data)} />}
      {part.status === 'error' && (
        <p
          data-slot="structured-output-error"
          className="text-sm text-destructive"
        >
          {part.errorMessage}
        </p>
      )}
    </div>
  )
}
