import type { TokenUsage } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import { defaultCatalog, estimateCost, useChat, useUsageTracker } from '@gedatou/cadenza-ai'
import { scripted, text, usage } from '@gedatou/cadenza-ai/mock'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { REPLIES } from './scripts'

// Proves `useUsageTracker`: wired to `onChunk` / `onFinish`, it books each
// run's tokens against the assistant message that closed it and keeps a
// running total; `estimateCost` prices both against a catalog model. The
// prompt grows every turn, so the numbers do too.
const model = defaultCatalog.getModel('openai/gpt-5.2')

function describe(u: TokenUsage): string {
  const cost = model && estimateCost(model, u)
  return `${u.totalTokens} tokens${cost === undefined ? '' : ` · $${cost.toFixed(4)}`}`
}

function Body(): ReactElement {
  const tracker = useUsageTracker()
  const [fetcher] = useState(() => scripted(ctx => [
    text(REPLIES.plan),
    usage({ inputTokens: 412 + 140 * ctx.turn, outputTokens: 96 }),
  ]))
  const chat = useChat({ fetcher, onChunk: tracker.onChunk, onFinish: tracker.onFinish })
  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-xs text-muted-foreground">
        total:
        {' '}
        {describe(tracker.total)}
      </p>
      <ChatShell
        chat={chat}
        empty="Every reply reports its tokens."
        renderActions={(message) => {
          const u = tracker.byMessage.get(message.id)
          return u && <span className="text-xs text-muted-foreground">{describe(u)}</span>
        }}
      />
    </div>
  )
}

export default function UsageDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
