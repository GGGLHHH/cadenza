'use client'
import type { ChangeEventDetails, DialogChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ByokClient, ByokSnapshot } from '@tanstack/ai-client/byok'
import type { FormEvent, ReactElement, ReactNode, RefObject } from 'react'
import type { Catalog } from '../catalog/types'
import { Button, cn, createChangeEventDetails, dataAttr, Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPopup, DialogTitle, Field, FieldError, FieldLabel, Input } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconServer, IconX } from '@tabler/icons-react'
import { useByok } from '@tanstack/ai-react'
import { createContext, use, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react'

/** Every visible string the dialog emits. Override through `labels`. */
export interface ByokKeyDialogLabels {
  title: string
  description: string
  save: string
  clear: string
  confirm: string
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
  confirm: 'Confirm',
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
  /** The input of the provider the client is prompting for; the dialog focuses it on open. */
  promptRef: RefObject<HTMLInputElement | null>
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
  /** Programmatic opens (a `byok.request()` prompt) carry `reason: 'none'`; the Confirm button closes with `reason: 'confirm'`. */
  onOpenChange?: (open: boolean, details: DialogChangeEventDetails | ChangeEventDetails<'none' | 'confirm'>) => void
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

  const change = (next: boolean, details: DialogChangeEventDetails | ChangeEventDetails<'none' | 'confirm'>): void => {
    onOpenChange?.(next, details)
    if (!details.isCanceled)
      setOpen(next)
  }
  const openForPrompt = useEffectEvent(() => change(true, createChangeEventDetails('none')))
  useEffect(() => {
    if (snapshot.prompt)
      openForPrompt()
  }, [snapshot.prompt])

  const promptRef = useRef<HTMLInputElement>(null)
  // The prompt is raised inside a send, while the composer still owns focus and
  // Base UI's initial focus can miss the not-yet-painted row: move it ourselves, and once more if that lost.
  useEffect(() => {
    if (!open || snapshot.prompt === null)
      return
    // Timers, not rAF: a background tab never paints, but the key should still be waiting in the right box.
    const timers = [0, 250].map(delay => setTimeout(() => {
      if (document.activeElement !== promptRef.current)
        promptRef.current?.focus()
    }, delay))
    return () => timers.forEach(clearTimeout)
  }, [open, snapshot.prompt])
  const formId = useId()
  // Remounting the rows after a confirm is what clears their drafts.
  const [epoch, setEpoch] = useState(0)
  const context = useMemo<ByokKeyDialogContextValue>(() => ({ byok, catalog, coverage, labels, snapshot, promptRef }), [byok, catalog, coverage, labels, snapshot])
  // Confirm: save every row that has a draft, then close. A refused save keeps the dialog open with the row's error.
  const confirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const entries = Array.from(new FormData(event.currentTarget).entries())
    try {
      for (const [id, value] of entries) {
        if (typeof value === 'string' && value.trim() !== '')
          await byok.update(id, value.trim())
      }
    }
    catch {
      return
    }
    setEpoch(e => e + 1)
    change(false, createChangeEventDetails('confirm', event.nativeEvent))
  }

  return (
    <ByokKeyDialogContext value={context}>
      <Dialog open={open} onOpenChange={change}>
        <DialogPopup data-slot="byok-key-dialog" initialFocus={() => promptRef.current ?? true}>
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form key={epoch} id={formId} className="flex flex-col gap-4" onSubmit={event => void confirm(event)}>
              {children ?? catalog.providers.map(p => <ByokKeyDialogProvider key={p.id} provider={p.id} />)}
            </form>
          </DialogBody>
          <DialogFooter>
            {snapshot.locked && (
              <Button onClick={() => void byok.unlock().catch(() => {})}>{labels.unlock}</Button>
            )}
            <DialogClose render={<Button variant="outline" />}>{labels.close}</DialogClose>
            <Button form={formId} type="submit">{labels.confirm}</Button>
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
 * `data-server-key` marks a provider the server can key on its own;
 * `data-prompted` is on while the client is asking for this provider's key.
 */
export function ByokKeyDialogProvider({ provider: id, children, className }: ByokKeyDialogProviderProps): ReactElement {
  const { byok, catalog, coverage, labels, snapshot, promptRef } = useByokKeyDialog()
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const provider = catalog.getProvider(id)
  if (provider === undefined)
    throw new Error(`cadenza-ai: ByokKeyDialogProvider: unknown provider "${id}".`)
  const status = snapshot.status[id] ?? { state: 'empty' as const }
  const serverKey = !provider.keyRequired || coverage?.[id] === true
  const key = draft.trim()
  const prompted = snapshot.prompt?.provider === id

  return (
    <div
      data-slot="byok-key-dialog-provider"
      data-provider={id}
      data-key-status={status.state}
      data-server-key={dataAttr(serverKey)}
      data-prompted={dataAttr(prompted)}
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
          ref={prompted ? promptRef : undefined}
          name={id}
          type="password"
          autoComplete="off"
          onKeyDown={(event) => {
            // Explicit: the submit button sits outside the form (`form=`), which implicit submission does not always honour.
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
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
