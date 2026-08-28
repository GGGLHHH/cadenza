'use client'
import type { ButtonProps, ChangeEventDetails } from '@gedatou/cadenza-ui'
import type { ComponentProps, KeyboardEvent, ReactElement, ReactNode } from 'react'
import type { ThreadIndex, ThreadMeta } from '../runtime/threads'
import { Button, cn, createChangeEventDetails, dataAttr, Input, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, ScrollArea } from '@gedatou/cadenza-ui'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconArchive, IconPencil, IconTrash } from '@tabler/icons-react'
import { createContext, use, useCallback, useMemo, useRef, useState } from 'react'

export type ThreadListChangeEventReason = 'item-press' | 'none'
export type ThreadListChangeEventDetails = ChangeEventDetails<ThreadListChangeEventReason>

interface ThreadListContextValue {
  index: ThreadIndex
  value: string | undefined
  select: (id: string, details: ThreadListChangeEventDetails) => void
}

const ThreadListContext = createContext<ThreadListContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ThreadListContext.displayName = 'ThreadListContext'

function useThreadList(): ThreadListContextValue {
  const context = use(ThreadListContext)
  if (context === null)
    throw new Error('cadenza-ai: ThreadListContext is missing. ThreadList parts must be placed within <ThreadList>.')
  return context
}

interface ThreadListItemContextValue {
  thread: ThreadMeta
  active: boolean
  renaming: boolean
  setRenaming: (renaming: boolean) => void
}

const ThreadListItemContext = createContext<ThreadListItemContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ThreadListItemContext.displayName = 'ThreadListItemContext'

function useThreadListItemContext(): ThreadListItemContextValue {
  const context = use(ThreadListItemContext)
  if (context === null)
    throw new Error('cadenza-ai: ThreadListItemContext is missing. ThreadListItem parts must be placed within <ThreadListItem>.')
  return context
}

/** The row a `ThreadListItem` action sits in. */
export function useThreadListItem(): { thread: ThreadMeta, active: boolean } {
  const { thread, active } = useThreadListItemContext()
  return { thread, active }
}

export interface ThreadListProps {
  index: ThreadIndex
  /** Already filtered by the caller (`useThreadIndex(index)` plus search / archive filters). */
  threads: readonly ThreadMeta[]
  value?: string
  defaultValue?: string
  onValueChange: (id: string, details: ThreadListChangeEventDetails) => void
  /** Omit it and every thread renders as a bare `ThreadListItem` — no groups, no actions. */
  children?: ReactNode
  /** Lands on the `ScrollArea` root; give it the height. */
  className?: string
}

/**
 * The scrolling list of threads. `ScrollArea` root > `div[role=list]`; the
 * current thread is the controlled `value`, and selecting a row (or `ThreadListNew`
 * creating one) reports through `onValueChange(id, details)`.
 */
export function ThreadList({ index, threads, value, defaultValue, onValueChange, children, className }: ThreadListProps): ReactElement {
  const [current, setCurrent] = useControllableState({ value, defaultValue })
  const select = useCallback((id: string, details: ThreadListChangeEventDetails) => {
    onValueChange(id, details)
    if (!details.isCanceled)
      setCurrent(id)
  }, [onValueChange, setCurrent])
  const context = useMemo<ThreadListContextValue>(() => ({ index, value: current, select }), [index, current, select])
  return (
    <ThreadListContext value={context}>
      <ScrollArea className={className}>
        <div role="list" data-slot="thread-list" className="flex flex-col gap-1">
          {children ?? threads.map(thread => <ThreadListItem key={thread.id} thread={thread} />)}
        </div>
      </ScrollArea>
    </ThreadListContext>
  )
}

export interface ThreadListGroupProps {
  /** A `ThreadListGroupLabel` first, then the group's items. */
  children: ReactNode
  className?: string
}

export function ThreadListGroup({ children, className }: ThreadListGroupProps): ReactElement {
  return (
    <div
      role="group"
      data-slot="thread-list-group"
      className={cn(`flex flex-col gap-1`, className)}
    >
      {children}
    </div>
  )
}

export type ThreadListGroupLabelProps = ComponentProps<'div'>

export function ThreadListGroupLabel({ className, ...props }: ThreadListGroupLabelProps): ReactElement {
  return (
    <div
      data-slot="thread-list-group-label"
      className={cn('ps-3 pbs-2 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export interface ThreadListItemProps {
  thread: ThreadMeta
  /** The actions area (`ThreadListRename` / `ThreadListArchive` / `ThreadListDelete`, or a menu holding them). */
  children?: ReactNode
  className?: string
}

export interface ThreadListItemState {
  active: boolean
  archived: boolean
  renaming: boolean
}

/**
 * One row: an `Item` whose content is a press target for selection, or — while
 * renaming — an inline `Input` (Enter / blur commit, Escape cancels). Mirrors its
 * state as `data-active` (+ `aria-current="page"`), `data-archived`, `data-renaming`.
 */
export function ThreadListItem({ thread, children, className }: ThreadListItemProps): ReactElement {
  const { index, value, select } = useThreadList()
  const [renaming, setRenaming] = useState(false)
  // Enter / Escape settle the edit; the blur that follows their unmount must not commit again.
  const settledRef = useRef(false)
  const active = value === thread.id
  const context = useMemo<ThreadListItemContextValue>(() => ({
    thread,
    active,
    renaming,
    setRenaming: (next) => {
      settledRef.current = false
      setRenaming(next)
    },
  }), [thread, active, renaming])

  const finish = (title: string | null): void => {
    if (settledRef.current)
      return
    settledRef.current = true
    const next = title?.trim() ?? ''
    if (next !== '' && next !== thread.title)
      index.rename(thread.id, next)
    setRenaming(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter')
      finish(event.currentTarget.value)
    else if (event.key === 'Escape')
      finish(null)
  }

  return (
    <ThreadListItemContext value={context}>
      <Item
        role="listitem"
        size="sm"
        data-slot="thread-list-item"
        data-active={dataAttr(active)}
        data-archived={dataAttr(thread.archived)}
        data-renaming={dataAttr(renaming)}
        aria-current={active ? 'page' : undefined}
        className={cn('data-active:bg-muted', className)}
      >
        <ItemContent>
          {renaming
            ? (
                <Input
                  autoFocus
                  defaultValue={thread.title}
                  onKeyDown={onKeyDown}
                  onBlur={event => finish(event.currentTarget.value)}
                />
              )
            : (
                <button
                  type="button"
                  className="
                    flex flex-col items-start rounded-md text-start outline-none
                    min-inline-0
                  "
                  onClick={event => select(thread.id, createChangeEventDetails('item-press', event.nativeEvent))}
                >
                  <ItemTitle>{thread.title}</ItemTitle>
                  {thread.preview !== '' && <ItemDescription>{thread.preview}</ItemDescription>}
                </button>
              )}
        </ItemContent>
        {children !== undefined && <ItemActions>{children}</ItemActions>}
      </Item>
    </ThreadListItemContext>
  )
}

type ButtonClickEvent = Parameters<NonNullable<ButtonProps['onClick']>>[0]

function handled(onClick: ButtonProps['onClick'], event: ButtonClickEvent): boolean {
  onClick?.(event)
  return event.defaultPrevented
}

export type ThreadListRenameProps = ButtonProps

/** Switches the row to its inline rename input. */
export function ThreadListRename({ children, onClick, ...props }: ThreadListRenameProps): ReactElement {
  const { setRenaming } = useThreadListItemContext()
  return (
    <Button
      data-slot="thread-list-rename"
      variant="ghost"
      size="icon-xs"
      {...props}
      onClick={(event) => {
        if (!handled(onClick, event))
          setRenaming(true)
      }}
    >
      {children ?? <IconPencil />}
    </Button>
  )
}

export type ThreadListArchiveProps = ButtonProps

/** Toggles `archived` through the index. */
export function ThreadListArchive({ children, onClick, ...props }: ThreadListArchiveProps): ReactElement {
  const { index } = useThreadList()
  const { thread } = useThreadListItemContext()
  return (
    <Button
      data-slot="thread-list-archive"
      variant="ghost"
      size="icon-xs"
      {...props}
      onClick={(event) => {
        if (!handled(onClick, event))
          index.archive(thread.id, !thread.archived)
      }}
    >
      {children ?? <IconArchive />}
    </Button>
  )
}

export type ThreadListDeleteProps = ButtonProps

/** Removes the thread from the index. Confirmation is the caller's — wrap it in an `AlertDialog`. */
export function ThreadListDelete({ children, onClick, ...props }: ThreadListDeleteProps): ReactElement {
  const { index } = useThreadList()
  const { thread } = useThreadListItemContext()
  return (
    <Button
      data-slot="thread-list-delete"
      variant="ghost"
      size="icon-xs"
      {...props}
      onClick={(event) => {
        if (!handled(onClick, event))
          index.remove(thread.id)
      }}
    >
      {children ?? <IconTrash />}
    </Button>
  )
}

export type ThreadListNewProps = ButtonProps

/** Creates an empty thread and selects it (`reason: 'item-press'`). */
export function ThreadListNew({ onClick, ...props }: ThreadListNewProps): ReactElement {
  const { index, select } = useThreadList()
  return (
    <Button
      data-slot="thread-list-new"
      variant="outline"
      {...props}
      onClick={(event) => {
        if (handled(onClick, event))
          return
        const thread = index.create()
        select(thread.id, createChangeEventDetails('item-press', event.nativeEvent))
      }}
    />
  )
}
