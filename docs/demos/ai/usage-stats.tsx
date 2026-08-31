import type { ReactElement } from 'react'
import { defaultCatalog, UsageStats, useChat, useUsageTracker } from '@gedatou/cadenza-ai'
import { reasoning, text, usage } from '@gedatou/cadenza-ai/mock'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'
import { REPLIES } from './scripts'

// Proves `usageMetrics` end to end. `cachedInputTokens` and `reasoningTokens`
// are AG-UI spec fields, but `cacheWriteTokens` and the modality breakdown have
// no spec slot — they travel as `details`, the scripted transport's name for the
// same `metadata.tanstack.usage` leftover the real one uses. If they show up in
// the tiles below, that channel survived the round trip.
//
// Which usage a panel shows is the caller's call, so the scope switch lives
// here rather than inside the part: the tracker already hands over all three.
const model = defaultCatalog.getModel('anthropic/claude-opus-5')

function Body(): ReactElement {
  const tracker = useUsageTracker()
  const [fetcher] = useState(() => mockFetcher(ctx => [
    reasoning('Weighing the options…'),
    text(REPLIES.plan),
    usage(
      { inputTokens: 8_400 + 1_200 * ctx.turn, outputTokens: 1_150, cachedInputTokens: 5_600, reasoningTokens: 480 },
      { promptTokensDetails: { cacheWriteTokens: 900, textTokens: 7_100, imageTokens: 1_300 }, cost: 0.0412 },
    ),
  ]))
  const chat = useChat({ fetcher, onChunk: tracker.onChunk, onFinish: tracker.onFinish })
  const last = chat.messages.filter(m => m.role === 'assistant').at(-1)
  const perMessage = last && tracker.byMessage.get(last.id)
  return (
    <div className="flex flex-col gap-4">
      <ChatShell chat={chat} empty="Send a turn or two, then compare the scopes." />
      <Tabs defaultValue="total">
        <TabsList>
          <TabsTab value="total">Session</TabsTab>
          <TabsTab value="run">Last run</TabsTab>
          <TabsTab value="message">Last message</TabsTab>
        </TabsList>
        <TabsPanel value="total"><UsageStats usage={tracker.total} model={model} /></TabsPanel>
        <TabsPanel value="run">
          {tracker.lastRun
            ? <UsageStats usage={tracker.lastRun} model={model} />
            : <p className="text-sm text-muted-foreground">No run yet.</p>}
        </TabsPanel>
        <TabsPanel value="message">
          {perMessage
            ? <UsageStats usage={perMessage} model={model} />
            : <p className="text-sm text-muted-foreground">No reply yet.</p>}
        </TabsPanel>
      </Tabs>
    </div>
  )
}

export default function UsageStatsDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-3xl">
      <Body />
    </ResettableDemo>
  )
}
