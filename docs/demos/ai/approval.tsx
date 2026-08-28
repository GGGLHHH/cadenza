import type { ToolRendererProps } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import {
  ApprovalActions,
  ApprovalApprove,
  ApprovalDeny,
  definePartRenderers,
  PartRenderersProvider,
  ToolCallCard,
  useChat,
} from '@gedatou/cadenza-ai'
import { approvalOf, sequence, text, tool } from '@gedatou/cadenza-ai/mock'
import { Input } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { move } from './tools'

// Proves the approval interrupt: Approve continues the run with the original
// arguments, Deny leaves the work alone, and editing the destination before
// Approve sends `editedArgs` instead — the script echoes what it received.
// Once the reader has answered, both buttons disable.

function argsOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function MoveCard({ part, result, interrupt, streaming }: ToolRendererProps): ReactElement {
  const args = argsOf(interrupt?.originalArgs ?? part.input)
  const [edited, setEdited] = useState<string | null>(null)
  const to = edited ?? (typeof args.to === 'string' ? args.to : '')
  return (
    <ToolCallCard part={part} result={result} interrupt={interrupt} streaming={streaming} defaultOpen>
      {interrupt !== undefined && (
        <ApprovalActions
          interrupt={interrupt}
          className="flex flex-wrap items-center gap-2"
        >
          <Input
            aria-label="Move to"
            value={to}
            onValueChange={value => setEdited(value)}
            className="max-inline-48"
          />
          <ApprovalApprove editedArgs={{ ...args, to }}>Approve</ApprovalApprove>
          <ApprovalDeny>Deny</ApprovalDeny>
        </ApprovalActions>
      )}
    </ToolCallCard>
  )
}

const renderers = definePartRenderers({
  toolCall: { move: props => <MoveCard {...props} /> },
})

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(sequence([
    [tool('move', { work: 'Firebird', to: 'before interval' }, { approval: true })],
    (ctx) => {
      const decision = approvalOf(ctx, 'call-1')
      return decision?.approved
        ? [tool.result('call-1', { moved: true, args: decision.editedArgs ?? null }), text('Moved.')]
        : [text('Left where it was.')]
    },
  ]), { toolCallId: () => 'call-1' }))
  const chat = useChat({ fetcher, tools: [move] })
  return (
    <PartRenderersProvider renderers={renderers}>
      <ChatShell chat={chat} empty="Ask to move the Firebird." />
    </PartRenderersProvider>
  )
}

export default function ApprovalDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
