'use client'
import type { ButtonProps } from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import type { AnyToolApprovalInterrupt } from '../runtime/renderers'
import { Button, dataAttr } from '@gedatou/cadenza-ui'
import { createContext, use, useMemo, useState } from 'react'

interface ApprovalContextValue {
  interrupt: AnyToolApprovalInterrupt
  responded: boolean
  choose: (approved: boolean) => void
}

const ApprovalContext = createContext<ApprovalContextValue | undefined>(undefined)
if (process.env.NODE_ENV !== 'production')
  ApprovalContext.displayName = 'ApprovalContext'

function useApprovalContext(): ApprovalContextValue {
  const context = use(ApprovalContext)
  if (context === undefined)
    throw new Error('cadenza-ai: ApprovalContext is missing. Approval parts must be placed within <ApprovalActions>.')
  return context
}

export interface ApprovalActionsProps {
  interrupt: AnyToolApprovalInterrupt
  /** `ApprovalApprove` / `ApprovalDeny`, with their own wording. */
  children: ReactNode
  className?: string
}

/**
 * The approve / deny row under a tool call. Resolves through the interrupt;
 * both buttons disable once `interrupt.status` leaves `pending`. The choice
 * lands on the row as `data-approved` / `data-denied`.
 */
export function ApprovalActions({ interrupt, children, className }: ApprovalActionsProps): ReactElement {
  const [choice, setChoice] = useState<boolean | undefined>(undefined)
  const responded = interrupt.status !== 'pending'
  const value = useMemo<ApprovalContextValue>(() => ({ interrupt, responded, choose: setChoice }), [interrupt, responded])
  return (
    <ApprovalContext value={value}>
      <div
        role="group"
        data-slot="approval-actions"
        data-approved={dataAttr(choice === true)}
        data-denied={dataAttr(choice === false)}
        className={className}
      >
        {children}
      </div>
    </ApprovalContext>
  )
}

export type ApprovalApproveProps = ButtonProps & {
  /** Arguments edited by the user, sent in place of the original ones. */
  editedArgs?: unknown
}

export function ApprovalApprove({ editedArgs, disabled, onClick, ...props }: ApprovalApproveProps): ReactElement {
  const { interrupt, responded, choose } = useApprovalContext()
  return (
    <Button
      data-slot="approval-approve"
      size="sm"
      {...props}
      disabled={disabled || responded}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        choose(true)
        interrupt.resolveInterrupt(true, { editedArgs })
      }}
    />
  )
}

export type ApprovalDenyProps = ButtonProps

export function ApprovalDeny({ disabled, onClick, ...props }: ApprovalDenyProps): ReactElement {
  const { interrupt, responded, choose } = useApprovalContext()
  return (
    <Button
      data-slot="approval-deny"
      size="sm"
      variant="outline"
      {...props}
      disabled={disabled || responded}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        choose(false)
        interrupt.resolveInterrupt(false)
      }}
    />
  )
}
