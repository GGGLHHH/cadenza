import type { KeyStatus } from '@gedatou/cadenza-ai'
import type { BadgeVariant } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { ByokKeyDialog, createByok, defaultCatalog, useByok, useChat } from '@gedatou/cadenza-ai'
import { byokMissing } from '@gedatou/cadenza-ai/mock'
import { Badge, Button } from '@gedatou/cadenza-ui'
import { useMemo, useState } from 'react'
import { ResettableDemo } from '../lib/resettable'
import { ChatShell } from './chat-shell'
import { mockFetcher } from './mock'

// Proves the key flow without a network: `useByok` mirrors each provider's
// KeyStatus (empty / set / locked / error), sending with no OpenAI key makes
// the client prompt before the request, and after a key is saved the scripted
// 401 (`byok_missing`) reopens the dialog from the server side. `coverage`
// marks providers the server keys itself; a button raises a prompt by hand.
const WATCHED = ['openai', 'anthropic', 'gemini', 'openrouter'] as const
const COVERAGE: Record<string, boolean> = { gemini: true }
const VARIANT: Record<KeyStatus['state'], BadgeVariant> = { empty: 'outline', set: 'default', locked: 'secondary', error: 'destructive' }

function Body(): ReactElement {
  const byok = useMemo(() => {
    const client = createByok({ catalog: defaultCatalog })
    // What `useServerCoverage` would learn from `/api/ai/catalog`.
    client.setServerCoverage(COVERAGE)
    return client
  }, [])
  const snapshot = useByok(byok)
  const [fetcher] = useState(() => mockFetcher(() => byokMissing('openai')))
  const chat = useChat({ fetcher, byok, byokProvider: () => 'openai' })
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {WATCHED.map((id) => {
          const status = snapshot.status[id] ?? { state: 'empty' }
          return (
            <Badge key={id} variant={VARIANT[status.state]}>
              {defaultCatalog.getProvider(id)?.label}
              {' · '}
              {status.state}
              {status.state !== 'empty' && ` ${status.masked}`}
            </Badge>
          )
        })}
        <Button className="ms-auto" size="sm" variant="outline" onClick={() => byok.request('anthropic', 'missing')}>
          Ask for an Anthropic key
        </Button>
      </div>
      <ChatShell
        chat={chat}
        empty="Send with no OpenAI key: the client prompts first. Save any key and send again: the scripted 401 reopens the dialog."
      />
      <ByokKeyDialog byok={byok} catalog={defaultCatalog} coverage={COVERAGE} />
    </div>
  )
}

export default function ByokDialogDemo(): ReactElement {
  return (
    <ResettableDemo className="max-inline-2xl">
      <Body />
    </ResettableDemo>
  )
}
