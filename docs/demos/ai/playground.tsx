import type { ByokClient, Catalog } from '@gedatou/cadenza-ai'
import type { ReactElement } from 'react'
import {
  ByokKeyDialog,
  createByok,
  createCatalog,
  createThreadIndex,
  defaultCatalog,
  fetchServerSentEvents,
  indexedDBPersistence,
  ModelPicker,
  modelRef,
  ThinkingLevelPicker,
  threadPersistence,
  useByok,
  useChat,
  useModelSelection,
  useServerCoverage,
} from '@gedatou/cadenza-ai'
import { Button } from '@gedatou/cadenza-ui'
import { IconKey } from '@tabler/icons-react'
import { useMemo } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { ThreadPane, useCurrentThread } from './threads'
import { getViewport } from './tools'

// The real thing: SSE against `/api/ai/chat`, pure BYOK (keys live in this
// tab's memory and travel as `x-byok-<provider>` headers), the model and
// thinking pickers feeding `forwardedProps`, a client tool the browser runs,
// and threads persisted locally. Sending without a key opens the dialog.
// `docs/app/api/ai/chat/route.ts` wires every built-in preset (12 on a local
// dev server, 11 on Vercel where `ollama` is dropped), so the catalog shown is
// whatever `/api/ai/catalog` reports, with `defaultCatalog` until it answers.
const connection = fetchServerSentEvents('/api/ai/chat')
const CURRENT_KEY = 'docs-playground:current'
const SELECTION_KEY = 'docs-playground:selection'
const index = createThreadIndex({ key: 'docs-playground', storage: 'local' })
const persistence = threadPersistence(index, indexedDBPersistence({ databaseName: 'cadenza-ai-docs-playground' }))

function Chat({ byok, catalog, threadId }: { byok: ByokClient, catalog: Catalog, threadId: string }): ReactElement {
  const sel = useModelSelection({ catalog, key: SELECTION_KEY })
  const snapshot = useByok(byok)
  const chat = useChat({
    connection,
    forwardedProps: sel.forwardedProps,
    byok,
    byokProvider: () => sel.selection.provider,
    tools: [getViewport],
    persistence,
    threadId,
  })
  return (
    <ChatShell
      chat={chat}
      empty="Save a key, pick a model, send. Ask for the window size to watch a client tool run."
      placeholder="Ask anything…"
      toolbar={(
        <>
          <ModelPicker
            byok={snapshot}
            catalog={catalog}
            value={modelRef({ provider: sel.selection.provider, id: sel.selection.model })}
            onValueChange={ref => sel.setModel(ref)}
          />
          <ThinkingLevelPicker model={sel.model} value={sel.selection.thinking} onValueChange={level => sel.setThinking(level)} />
          <Button
            aria-label="API keys"
            size="icon-sm"
            variant="ghost"
            onClick={() => byok.request(sel.selection.provider, 'missing')}
          >
            <IconKey />
          </Button>
        </>
      )}
    />
  )
}

function Workspace(): ReactElement {
  const byok = useMemo(() => createByok({ catalog: defaultCatalog }), [])
  const { coverage, providers } = useServerCoverage(byok)
  const catalog = useMemo(() => (providers ? createCatalog(providers) : defaultCatalog), [providers])
  const [threadId, setThreadId] = useCurrentThread(index, CURRENT_KEY)
  return (
    <div className="
      flex flex-col gap-3
      md:flex-row
    "
    >
      <ThreadPane index={index} persistence={persistence} value={threadId} onValueChange={setThreadId} />
      <div className="flex flex-1 flex-col min-inline-0">
        <Chat key={threadId} byok={byok} catalog={catalog} threadId={threadId} />
      </div>
      <ByokKeyDialog byok={byok} catalog={catalog} coverage={coverage} />
    </div>
  )
}

async function wipe(): Promise<void> {
  for (const thread of index.list())
    await persistence.removeItem(thread.id)
  localStorage.removeItem(CURRENT_KEY)
  localStorage.removeItem(SELECTION_KEY)
}

export default function PlaygroundDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-none" onReset={wipe}>
      <Workspace />
    </ResettableDemo>
  )
}
