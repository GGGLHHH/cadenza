'use client'

import type { ByokClient, Catalog, UIMessage } from '@gedatou/cadenza-ai'
import type { ReactElement, RefObject } from 'react'
import {
  ByokKeyDialog,
  ByokKeyDialogProvider,
  ComposerDictate,
  createByok,
  createCatalog,
  createThreadIndex,
  defaultCatalog,
  fetchServerSentEvents,
  indexedDBPersistence,
  isByokError,
  messageText,
  ModelPicker,
  modelRef,
  ThinkingLevelPicker,
  threadPersistence,
  threadTitleFrom,
  TranscriptError,
  useByok,
  useChat,
  useModelSelection,
  useServerCoverage,
  useStoredState,
  useSummarize,
  useTranscription,
} from '@gedatou/cadenza-ai'
import { Button, cn, ToggleGroup, ToggleGroupItem } from '@gedatou/cadenza-ui'
import { IconKey } from '@tabler/icons-react'
import { completeOpenRouterPkceIntoByok, startOpenRouterPkceLogin } from '@tanstack/ai-openrouter/pkce'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { ThreadPane, useCurrentThread } from './threads'
import { getViewport } from './tools'

// The real thing, in two frames: the docs demo (`default`) and the full-screen
// app at `/playground` (`PlaygroundApp`) — same workspace, the app drops the
// border and fills the viewport under the header. SSE against `/api/ai/chat`, pure BYOK (keys live in this
// tab's memory and travel as `x-byok-<provider>` headers), the model and
// thinking pickers feeding `forwardedProps`, a client tool the browser runs,
// and threads persisted locally. Sending without a key opens the dialog.
// `docs/app/api/ai/chat/route.ts` wires every built-in preset (12 on a local
// dev server, 11 on Vercel where `ollama` is dropped), so the catalog shown is
// whatever `/api/ai/catalog` reports, with `defaultCatalog` until it answers.
// Two side channels compose on top: dictation (`useTranscription` against
// `/api/ai/transcription`, OpenAI only, appended to the draft) and the thread
// title (`useSummarize` against `/api/ai/title`, which asks the thread's own
// model — ChatGPT style: "New chat" until the first reply, then a short name).
// The openrouter key row also offers PKCE sign-in: `startOpenRouterPkceLogin`
// leaves for openrouter.ai and comes back to this page with `?code=`, which
// `completeOpenRouterPkceIntoByok` exchanges into the keyring on mount.
const connection = fetchServerSentEvents('/api/ai/chat')
const dictation = fetchServerSentEvents('/api/ai/transcription')
const titling = fetchServerSentEvents('/api/ai/title')
const CURRENT_KEY = 'docs-playground:current'
const SELECTION_KEY = 'docs-playground:selection'
const SCROLL_KEY = 'docs-playground:scroll'
type ScrollMode = 'pin' | 'follow'
const SCROLL_MODES: readonly ScrollMode[] = ['pin', 'follow']
const index = createThreadIndex({ key: 'docs-playground', storage: 'local' })
// No derived title: the list says "New chat" until the model names the thread.
const persistence = threadPersistence(index, indexedDBPersistence({ databaseName: 'cadenza-ai-docs-playground' }), { title: false })
// The exchange is not idempotent (the code is single-use and the pending
// verifier is cleared after the first await), so StrictMode's second effect run must not repeat it.
let pkceCompleted = false

function Chat({ anchorTurns, byok, catalog, className, resumeRef, threadId }: { anchorTurns: boolean, byok: ByokClient, catalog: Catalog, className?: string, resumeRef: RefObject<(() => void) | null>, threadId: string }): ReactElement {
  const sel = useModelSelection({ catalog, key: SELECTION_KEY })
  const snapshot = useByok(byok)
  const [draft, setDraft] = useState('')
  // The last recording, kept so a dictation refused for a missing OpenAI key can run once the key is in.
  const lastAudioRef = useRef<string>(null)
  const transcription = useTranscription({
    connection: dictation,
    byok,
    byokProvider: () => 'openai',
    // Each recording appends to whatever is already typed.
    onResult: r => setDraft(d => (d === '' ? r.text : `${d} ${r.text}`)),
  })
  const messagesRef = useRef<readonly UIMessage[]>([])
  const titledRef = useRef(false)
  // The title comes from the model this thread talks to, through the same key;
  // if that fails, fall back to the first message so the row is not blank forever.
  const summary = useSummarize({
    connection: titling,
    // `body` lands in the request's `forwardedProps`, so the title route picks
    // this thread's provider / model — without it the route would fall back to a
    // provider the user never chose and prompt for its key after every reply.
    body: sel.forwardedProps,
    byok,
    byokProvider: () => sel.selection.provider,
    onResult: (r) => {
      const title = r.summary.trim()
      if (title !== '' && (index.get(threadId)?.title ?? '') === '')
        index.rename(threadId, title)
    },
    onError: () => {
      if ((index.get(threadId)?.title ?? '') === '')
        index.rename(threadId, threadTitleFrom(messagesRef.current))
    },
  })
  const chat = useChat({
    connection,
    forwardedProps: sel.forwardedProps,
    byok,
    byokProvider: () => sel.selection.provider,
    tools: [getViewport],
    persistence,
    threadId,
    onFinish: (message) => {
      // First assistant reply and the thread is still unnamed: ask the model for a title, once.
      const user = messagesRef.current.find(m => m.role === 'user')
      if (titledRef.current || user === undefined || (index.get(threadId)?.title ?? '') !== '')
        return
      titledRef.current = true
      void summary.generate({ text: `User: ${messageText(user)}\nAssistant: ${messageText(message)}` })
    },
  })
  messagesRef.current = chat.messages
  // The key dialog closing is the moment to finish what a missing key refused:
  // the last send (still in the transcript, with `chat.error`) or the last dictation.
  resumeRef.current = () => {
    const keyed = (id: string): boolean => snapshot.status[id]?.state === 'set' || catalog.getProvider(id)?.keyRequired === false
    if (chat.error !== undefined && isByokError(chat.error) && keyed(sel.selection.provider))
      void chat.reload()
    if (transcription.error !== undefined && isByokError(transcription.error) && lastAudioRef.current !== null && keyed('openai'))
      void transcription.generate({ audio: lastAudioRef.current })
  }
  return (
    <ChatShell
      chat={chat}
      anchorTurns={anchorTurns}
      className={className}
      empty="Save a key, pick a model, send. Ask for the window size to watch a client tool run."
      placeholder="Ask anything…"
      value={draft}
      onValueChange={value => setDraft(value)}
      attachments={transcription.error !== undefined && (
        <TranscriptError error={transcription.error}>{transcription.error.message}</TranscriptError>
      )}
      toolbar={(
        <>
          <ComposerDictate
            disabled={transcription.isLoading}
            onRecording={(part) => {
              lastAudioRef.current = part.source.type === 'data' ? `data:${part.source.mimeType};base64,${part.source.value}` : part.source.value
              void transcription.generate({ audio: lastAudioRef.current })
            }}
          />
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

type Layout = 'demo' | 'app'

function Workspace({ layout, onReset }: { layout: Layout, onReset?: () => void }): ReactElement {
  // Keys persist behind a passkey (encrypted IndexedDB) where the browser can; elsewhere memory, and the dialog says so.
  const byok = useMemo(() => createByok({ catalog: defaultCatalog, persistent: true }), [])
  const { coverage, providers } = useServerCoverage(byok)
  const catalog = useMemo(() => (providers ? createCatalog(providers) : defaultCatalog), [providers])
  const [threadId, setThreadId] = useCurrentThread(index, CURRENT_KEY)
  const [pkceError, setPkceError] = useState<string>()
  const resumeRef = useRef<(() => void) | null>(null)
  // Scroll mode is a reader preference, so it lives beside the model selection in localStorage.
  const [scroll, setScroll] = useStoredState<ScrollMode>(SCROLL_KEY, 'pin')
  const app = layout === 'app'
  useEffect(() => {
    if (pkceCompleted)
      return
    pkceCompleted = true
    void completeOpenRouterPkceIntoByok(byok).catch((error: unknown) => {
      setPkceError(error instanceof Error ? error.message : String(error))
      byok.request('openrouter', 'missing')
    })
  }, [byok])
  return (
    <div className={cn(`
      flex flex-col gap-3
      md:flex-row
    `, app && `flex-1 gap-0 min-block-0`)}
    >
      <ThreadPane
        index={index}
        persistence={persistence}
        value={threadId}
        sidebarClassName={app ? 'p-3 inline-72' : undefined}
        untitled="New chat"
        triggerClassName={app ? 'm-3 mbe-0' : undefined}
        footer={app && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup<ScrollMode>
              aria-label="Scroll mode"
              size="sm"
              spacing={0}
              value={[scroll]}
              variant="outline"
              onValueChange={([next]) => {
                if (next !== undefined)
                  setScroll(next)
              }}
            >
              {SCROLL_MODES.map(mode => (
                <ToggleGroupItem key={mode} value={mode}>{mode === 'pin' ? 'Pin' : 'Follow'}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            {onReset !== undefined && (
              <Button size="sm" variant="ghost" onClick={() => void byok.clear().catch(() => {}).finally(onReset)}>
                Reset playground
              </Button>
            )}
          </div>
        )}
        onValueChange={setThreadId}
      />
      <div className={cn('flex flex-1 flex-col min-block-0 min-inline-0', app && `
        mx-auto inline-full max-inline-4xl
      `)}
      >
        <Chat
          key={threadId}
          byok={byok}
          catalog={catalog}
          anchorTurns={scroll === 'pin'}
          className={app ? 'flex-1 rounded-none border-0 min-block-0' : undefined}
          resumeRef={resumeRef}
          threadId={threadId}
        />
      </div>
      <ByokKeyDialog
        byok={byok}
        catalog={catalog}
        coverage={coverage}
        onOpenChange={(open) => {
          if (!open)
            resumeRef.current?.()
        }}
      >
        {catalog.providers.map(p => (
          <ByokKeyDialogProvider key={p.id} provider={p.id}>
            {p.id === 'openrouter' && (
              <div className="flex flex-col items-end gap-1">
                {pkceError !== undefined && (
                  <span
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {pkceError}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={() => void startOpenRouterPkceLogin()}>
                  Sign in with OpenRouter
                </Button>
              </div>
            )}
          </ByokKeyDialogProvider>
        ))}
      </ByokKeyDialog>
    </div>
  )
}

async function wipe(): Promise<void> {
  for (const thread of index.list())
    await persistence.removeItem(thread.id)
  localStorage.removeItem(CURRENT_KEY)
  localStorage.removeItem(SELECTION_KEY)
  localStorage.removeItem(SCROLL_KEY)
}

/** `/playground`: the workspace without a demo frame; Reset wipes both stores and remounts. */
export function PlaygroundApp(): ReactElement {
  const [epoch, setEpoch] = useState(0)
  return (
    <Workspace
      key={epoch}
      layout="app"
      onReset={() => {
        void wipe().then(() => setEpoch(e => e + 1))
      }}
    />
  )
}

export default function PlaygroundDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-none" onReset={wipe}>
      <Workspace layout="demo" />
    </ResettableDemo>
  )
}
