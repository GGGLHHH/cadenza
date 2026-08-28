'use client'
import type { ChangeEventDetails, DialogChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ByokClient, ByokSnapshot } from '@tanstack/ai-client/byok'
import type { ReactElement, ReactNode } from 'react'
import type { Catalog } from '../catalog/types'
import { Button, cn, createChangeEventDetails, dataAttr, Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPopup, DialogTitle, Field, FieldError, FieldLabel, Input } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconServer, IconX } from '@tabler/icons-react'
import { useByok } from '@tanstack/ai-react'
import { createContext, use, useEffect, useEffectEvent, useId, useMemo, useState } from 'react'

/** Every visible string the dialog emits. Override through `labels`. */
export interface ByokKeyDialogLabels {
  title: string
  description: string
  save: string
  clear: string
  unlock: string
  close: string
  /** `aria-label` of the icon marking a provider the server already holds a key for. */
  serverKey: string
}

export const DEFAULT_BYOK_KEY_DIALOG_LABELS: ByokKeyDialogLabels = {
  title: 'API keys',
  description: 'Keys stay in this browser and are sent per request in a header.',
  save: 'Save',
  clear: 'Clear',
  unlock: 'Unlock',
  close: 'Close',
  serverKey: 'Server key',
}

interface ByokKeyDialogContextValue {
  byok: ByokClient
  catalog: Catalog
  coverage: Record<string, boolean> | undefined
  labels: ByokKeyDialogLabels
  snapshot: ByokSnapshot
}

const ByokKeyDialogContext = createContext<ByokKeyDialogContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ByokKeyDialogContext.displayName = 'ByokKeyDialogContext'

function useByokKeyDialog(): ByokKeyDialogContextValue {
  const context = use(ByokKeyDialogContext)
  if (context === null)
    throw new Error('cadenza-ai: ByokKeyDialogContext is missing. ByokKeyDialog parts must be placed within <ByokKeyDialog>.')
  return context
}

export interface ByokKeyDialogProps {
  byok: ByokClient
  catalog: Catalog
  /**
   * Which providers the server can key from its own env — `useServerCoverage(byok).coverage`.
   * `ByokClient` keeps its coverage private, so the dialog is told separately.
   */
  coverage?: Record<string, boolean>
  open?: boolean
  defaultOpen?: boolean
  /** Programmatic opens (a `byok.request()` prompt) carry `reason: 'none'`. */
  onOpenChange?: (open: boolean, details: DialogChangeEventDetails | ChangeEventDetails<'none'>) => void
  labels?: Partial<ByokKeyDialogLabels>
  /** Omit it and every catalog provider gets a `ByokKeyDialogProvider` row. */
  children?: ReactNode
}

/**
 * The key-entry dialog for a `ByokClient`. Subscribes to the client and opens
 * itself whenever it raises a prompt (`prepare()` blocked on a missing key, or
 * the server answered `byok_missing`), focusing that provider's input.
 */
export function ByokKeyDialog({ byok, catalog, coverage, open: openProp, defaultOpen, onOpenChange, labels: labelsProp, children }: ByokKeyDialogProps): ReactElement {
  const snapshot = useByok(byok)
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, fallback: false })
  const labels = useMemo(() => ({ ...DEFAULT_BYOK_KEY_DIALOG_LABELS, ...labelsProp }), [labelsProp])

  const change = (next: boolean, details: DialogChangeEventDetails | ChangeEventDetails<'none'>): void => {
    onOpenChange?.(next, details)
    if (!details.isCanceled)
      setOpen(next)
  }
  const openForPrompt = useEffectEvent(() => change(true, createChangeEventDetails('none')))
  useEffect(() => {
    if (snapshot.prompt)
      openForPrompt()
  }, [snapshot.prompt])

  const context = useMemo<ByokKeyDialogContextValue>(() => ({ byok, catalog, coverage, labels, snapshot }), [byok, catalog, coverage, labels, snapshot])

  return (
    <ByokKeyDialogContext value={context}>
      <Dialog open={open} onOpenChange={change}>
        <DialogPopup data-slot="byok-key-dialog">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            {children ?? catalog.providers.map(p => <ByokKeyDialogProvider key={p.id} provider={p.id} />)}
          </DialogBody>
          <DialogFooter>
            {snapshot.locked && (
              <Button onClick={() => void byok.unlock().catch(() => {})}>{labels.unlock}</Button>
            )}
            <DialogClose render={<Button variant="outline" />}>{labels.close}</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </ByokKeyDialogContext>
  )
}

export interface ByokKeyDialogProviderProps {
  /** Catalog provider id. */
  provider: string
  /** Appended at the end of the row — an OAuth / PKCE button, say. */
  children?: ReactNode
  className?: string
}

/**
 * One provider's row: label, password input, save / clear icon buttons.
 * `data-key-status` mirrors the client's `empty | set | locked | error`;
 * `data-server-key` marks a provider the server can key on its own.
 */
export function ByokKeyDialogProvider({ provider: id, children, className }: ByokKeyDialogProviderProps): ReactElement {
  const { byok, catalog, coverage, labels, snapshot } = useByokKeyDialog()
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const provider = catalog.getProvider(id)
  if (provider === undefined)
    throw new Error(`cadenza-ai: ByokKeyDialogProvider: unknown provider "${id}".`)
  const status = snapshot.status[id] ?? { state: 'empty' as const }
  const serverKey = !provider.keyRequired || coverage?.[id] === true
  const key = draft.trim()

  return (
    <div
      data-slot="byok-key-dialog-provider"
      data-provider={id}
      data-key-status={status.state}
      data-server-key={dataAttr(serverKey)}
      className={cn('flex items-end gap-2', className)}
    >
      <Field className="flex-1">
        <FieldLabel htmlFor={inputId}>
          {provider.label}
          {serverKey && (
            <IconServer
              aria-label={labels.serverKey}
              className="text-muted-foreground block-4 inline-4"
            />
          )}
        </FieldLabel>
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          autoFocus={snapshot.prompt?.provider === id}
          placeholder={status.state === 'empty' ? undefined : status.masked}
          value={draft}
          onValueChange={setDraft}
        />
        {status.state === 'error' && <FieldError>{status.message}</FieldError>}
      </Field>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={labels.save}
        disabled={key === ''}
        onClick={() => void byok.update(id, key).then(() => setDraft(''), () => {})}
      >
        <IconCheck />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={labels.clear}
        disabled={status.state === 'empty'}
        onClick={() => void byok.clear(id).catch(() => {})}
      >
        <IconX />
      </Button>
      {children}
    </div>
  )
}
