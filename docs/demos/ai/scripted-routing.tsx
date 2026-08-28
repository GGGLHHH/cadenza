import type { ScriptContext, Step } from '@gedatou/cadenza-ai/mock'
import type { ReactElement } from 'react'
import { useChat } from '@gedatou/cadenza-ai'
import { approvalOf, echo, respond, sequence, text, tool } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { planningReply } from './scripts'
import { getTime, move } from './tools'

// Proves multi-turn routing: `respond` picks a reply by the last user message
// (a regex, or any predicate over the context), `sequence` answers by turn
// number, `echo` is the fallback, and a script function reads the previous
// run's approval with `approvalOf` to continue an interrupted tool call.
function moveWithApproval(ctx: ScriptContext): Step[] {
  // The resume turn keeps the same user message, so this rule fires again;
  // the id is turn-stamped so `approvalOf` finds last turn's interrupt.
  const decision = approvalOf(ctx, `move-${ctx.turn - 1}`)
  if (decision === undefined) {
    return [
      text('Firebird before La Mer? That needs a sign-off.'),
      tool('move', { work: 'Firebird', before: 'La Mer' }, { approval: true, toolCallId: `move-${ctx.turn}` }),
    ]
  }
  return decision.approved
    ? [tool.result(`move-${ctx.turn - 1}`, { ok: true }), text('Moved — Firebird now opens the second half.')]
    : [tool.result(`move-${ctx.turn - 1}`, { ok: false }, { error: true }), text('Left as it was.')]
}

const script = respond([
  [/^\/plan/, planningReply()],
  [/move/i, moveWithApproval],
  [ctx => ctx.messages.length >= 8, [text('This thread is getting long — start a new one?')]],
], sequence([
  [text('First turn: try `/plan`, `move Firebird`, or anything else.')],
  echo(),
]))

function Body(): ReactElement {
  const [fetcher] = useState(() => mockFetcher(script))
  const chat = useChat({ fetcher, tools: [getTime, move] })
  return <ChatShell chat={chat} empty="Try: “/plan”, “move Firebird”, or anything else." />
}

export default function ScriptedRoutingDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
