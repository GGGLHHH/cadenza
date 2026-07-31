'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { Key, Selection } from 'react-aria-components'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import { Button } from '@gedatou/cadenza-ui/primitives/button'
import { ScrollArea } from '@gedatou/cadenza-ui/primitives/scroll-area'
import { Separator } from '@gedatou/cadenza-ui/primitives/separator'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { createContext, use, useRef } from 'react'
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  SearchField,
} from 'react-aria-components'

/**
 * Searchable infinite-scrolling list panel, single or multi select.
 *
 * React Aria owns the behaviour: `Autocomplete` wires the search input to the
 * list with virtual focus (arrow keys navigate while the input keeps DOM focus),
 * `ListBox` owns selection semantics and typeahead, and `ListBoxLoadMoreItem`
 * fires `onLoadMore` as its sentinel approaches the viewport. The panel itself
 * renders zero copy — state messages come in through the slot children
 * (`InfiniteSelectEmpty` / `Loading` / `Error`), so i18n stays in
 * the caller's layer.
 */
export interface InfiniteSelectOption {
  id: string
  label: ReactNode
  /** Typeahead text. Required when `label` is not a plain string. */
  textValue?: string
  disabled?: boolean
}

/**
 * Context handed to a custom item renderer. Unlike the DOM-level version this
 * replaces the row *content*, not the row: the `ListBoxItem` shell stays, so
 * keyboard navigation and selection wiring survive the override.
 */
export interface InfiniteSelectItemRenderParams<T> {
  item: T
  option: InfiniteSelectOption
  selected: boolean
  isMultiple: boolean
}

/** The list-state props a data adapter must supply (a react-query wrapper, say). */
export interface InfiniteSelectAdapterProps<T> {
  items: T[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  isError: boolean
  onLoadMore: () => void
  onRetry: () => void
}

interface InfiniteSelectCommonProps<T> {
  /** Accessible name for the option list. Falls back to `searchPlaceholder`. */
  'aria-label'?: string
  'items': T[]

  'isLoading'?: boolean
  'isFetchingNextPage'?: boolean
  'hasNextPage'?: boolean
  'isError'?: boolean

  'onLoadMore'?: () => void
  'onRetry'?: () => void

  'onSearchInputValueChange'?: (value: string) => void
  'searchInputValue'?: string

  'getOption': (item: T) => InfiniteSelectOption

  /** Replaces the default row content while keeping RAC selection and focus. */
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode

  'searchPlaceholder'?: string
  /**
   * Rendered inside the list, at the end of the scrolled content, while the
   * next page is fetching. In-flow on purpose: prefetch fires a viewport ahead,
   * so a user at the top never sees it — only someone at the bottom, exactly
   * when it is relevant. Position is the base's call, which is why this is a
   * prop and not a slot child.
   */
  'loadingMoreIndicator'?: ReactNode

  'maxListHeight'?: number
  'className'?: string
  /**
   * The single slot channel: state slots (`InfiniteSelectEmpty` / `Loading` /
   * `Error`, context-driven and self-rendering) plus the footer
   * bar (`InfiniteSelectFooter`, last child lands at the bottom naturally).
   * The base renders no copy of its own.
   */
  'children'?: ReactNode
}

/** Controlled/uncontrolled selection props for single and multi-select modes. */
export type ControllableSelectionProps<TItem = unknown>
  = | {
    multiple: true
    value?: string[]
    defaultValue?: string[]
    /**
     * `ids` is the authoritative selection (every toggled id), while `items`
     * only holds the objects that were actually loaded — a preselected id from
     * an unloaded page has an id but no item. Persist `ids`, not `items`.
     */
    onChange?: (items: TItem[], ids: string[]) => void
  }
  | {
    multiple?: false
    value?: string
    defaultValue?: string
    onChange?: (item: TItem | undefined) => void
  }

export type InfiniteSelectProps<T> = InfiniteSelectCommonProps<T> & ControllableSelectionProps<T>

/** Shared status container for the state slots: `role=status` announces changes. */
export function InfiniteSelectStatus({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('px-2 py-3 text-sm text-muted-foreground', className)}
      data-slot="infinite-select-status"
      role="status"
      {...props}
    />
  )
}

// ── State slots: context-driven, zero copy in the base. States are mutually
//    exclusive, so at most one InfiniteSelectStatus renders at a time. ──
interface InfiniteSelectState {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  isFetchingNextPage: boolean
  onRetry?: (() => void) | undefined
}

const InfiniteSelectStateContext = createContext<InfiniteSelectState | null>(null)

function useInfiniteSelectState(): InfiniteSelectState {
  const ctx = use(InfiniteSelectStateContext)
  if (!ctx)
    throw new Error('InfiniteSelect state slots must be used inside InfiniteSelect children')
  return ctx
}

/** Empty slot: renders its children when the list has no results. */
export function InfiniteSelectEmpty(props: ComponentProps<'div'>): ReactElement | null {
  const { isEmpty } = useInfiniteSelectState()
  return isEmpty ? <InfiniteSelectStatus {...props} /> : null
}

/** Loading slot: renders its children during the first-page load. */
export function InfiniteSelectLoading(props: ComponentProps<'div'>): ReactElement | null {
  const { isLoading } = useInfiniteSelectState()
  return isLoading ? <InfiniteSelectStatus {...props} /> : null
}

/** Error slot: container for the error copy plus `InfiniteSelectRetry`. */
export function InfiniteSelectError({ className, ...props }: ComponentProps<'div'>): ReactElement | null {
  const { isError } = useInfiniteSelectState()
  return isError
    ? (
        <InfiniteSelectStatus
          className={cn(`flex flex-col items-center gap-2 py-4`, className)}
          {...props}
        />
      )
    : null
}

/** Retry button: wired to the panel's `onRetry`; renders nothing without one. */
export function InfiniteSelectRetry({ onPress, ...props }: ComponentProps<typeof Button>): ReactElement | null {
  const { onRetry } = useInfiniteSelectState()
  if (!onRetry)
    return null
  return (
    <Button
      data-slot="infinite-select-retry"
      onPress={(event) => {
        onRetry()
        onPress?.(event)
      }}
      size="sm"
      type="button"
      variant="outline"
      {...props}
    />
  )
}

export function InfiniteSelect<T>(props: InfiniteSelectProps<T>): ReactElement {
  const {
    items,
    isLoading = false,
    isFetchingNextPage = false,
    hasNextPage = false,
    isError = false,
    onLoadMore,
    onRetry,
    onSearchInputValueChange,
    searchInputValue,
    getOption,
    renderItem,
    'aria-label': ariaLabel,
    searchPlaceholder = 'Search',
    loadingMoreIndicator,
    maxListHeight = 256,
    className,
    children,
  } = props

  const isMultiple = props.multiple === true
  // Key presence, not `!== undefined`: a controlled single select passes
  // `value={undefined}` for "nothing selected", and flipping to uncontrolled
  // there would both warn (RAC) and pin the stale internal selection.
  const isControlled = 'value' in props

  // `ids` from onSelectionChange is authoritative; this cache only echoes item
  // objects for ids whose page happens to be loaded. Search can swap `items`
  // wholesale, so selected objects are remembered across pages here.
  const selectedItemsCacheRef = useRef<Map<string, T>>(new Map())
  const lastSelectionRef = useRef<string[]>(
    isMultiple
      ? ((props.value ?? props.defaultValue ?? []) as string[])
      : [props.value ?? props.defaultValue].filter((id): id is string => id !== undefined),
  )
  if (isControlled) {
    lastSelectionRef.current = isMultiple
      ? ((props.value ?? []) as string[])
      : props.value === undefined ? [] : [props.value]
  }
  if (isMultiple) {
    for (const item of items) {
      const id = getOption(item).id
      if (lastSelectionRef.current.includes(id))
        selectedItemsCacheRef.current.set(id, item)
    }
  }

  const handleSelectionChange = (selection: Selection): void => {
    const ids = selection === 'all'
      ? items.map(item => getOption(item).id)
      : [...selection].map(String)
    lastSelectionRef.current = ids

    if (props.multiple) {
      for (const item of items) {
        const id = getOption(item).id
        if (ids.includes(id))
          selectedItemsCacheRef.current.set(id, item)
      }
      for (const id of [...selectedItemsCacheRef.current.keys()]) {
        if (!ids.includes(id))
          selectedItemsCacheRef.current.delete(id)
      }
      const nextItems = ids
        .map(id => selectedItemsCacheRef.current.get(id))
        .filter((entry): entry is T => entry !== undefined)
      props.onChange?.(nextItems, ids)
      return
    }

    const id = ids[0]
    props.onChange?.(id === undefined ? undefined : items.find(item => getOption(item).id === id))
  }

  const selectedKeys: Key[] | undefined = isControlled ? lastSelectionRef.current : undefined
  const defaultSelectedKeys: Key[] = isMultiple
    ? ((props.defaultValue ?? []) as string[])
    : [props.defaultValue].filter((id): id is string => id !== undefined)

  // States are mutually exclusive; the scrolling list only exists with results.
  const isEmpty = !isLoading && !isError && items.length === 0
  const hasItems = !isLoading && !isError && items.length > 0

  return (
    <div
      className={cn(
        `
          flex flex-col rounded-md border border-border bg-popover
          text-popover-foreground shadow-md inline-full
        `,
        className,
      )}
      data-slot="infinite-select"
    >
      <InfiniteSelectStateContext
        value={{ isLoading, isError, isEmpty, isFetchingNextPage, onRetry }}
      >
        <Autocomplete
          inputValue={searchInputValue}
          onInputChange={onSearchInputValueChange}
        >
          <SearchField
            aria-label={searchPlaceholder}
            className="flex items-center gap-2 border-be border-border px-3"
            data-slot="infinite-select-search"
          >
            <IconSearch className="
              shrink-0 text-muted-foreground block-4 inline-4
            "
            />
            <Input
              className="
                flex-1 bg-transparent py-2 text-sm/5 text-popover-foreground
                outline-none min-inline-0
                placeholder:text-muted-foreground
                [&::-webkit-search-cancel-button]:appearance-none
              "
              placeholder={searchPlaceholder}
            />
          </SearchField>

          {hasItems && (
            <ScrollArea
              className="scroll-fade-y"
              style={{ maxHeight: maxListHeight }}
            >
              <ListBox
                aria-label={ariaLabel ?? searchPlaceholder}
                className="flex flex-col gap-0.5 p-1 outline-none"
                data-slot="infinite-select-list"
                selectionMode={isMultiple ? 'multiple' : 'single'}
                {...(selectedKeys ? { selectedKeys } : { defaultSelectedKeys })}
                onSelectionChange={handleSelectionChange}
              >
                {items.map((item) => {
                  const option = getOption(item)
                  return (
                    <ListBoxItem
                      key={option.id}
                      className={cn(
                        `
                          flex cursor-default items-center gap-2 rounded-lg px-2
                          py-1.5 text-sm/5 text-popover-foreground
                          transition-colors outline-none select-none inline-full
                        `,
                        `
                          data-focused:bg-muted
                          data-hovered:bg-muted
                          data-pressed:translate-y-px
                          data-selected:bg-muted/50
                          data-selected:data-focused:bg-muted
                          data-selected:data-hovered:bg-muted
                        `,
                        `
                          data-disabled:cursor-not-allowed
                          data-disabled:opacity-50
                        `,
                      )}
                      data-slot="infinite-select-item"
                      id={option.id}
                      isDisabled={option.disabled}
                      textValue={option.textValue ?? (typeof option.label === 'string' ? option.label : option.id)}
                    >
                      {({ isSelected }) => renderItem
                        ? renderItem({ item, option, selected: isSelected, isMultiple })
                        : (
                            <>
                              {isMultiple && (
                                <span
                                  aria-hidden
                                  data-slot="infinite-select-checkbox"
                                  className={cn(
                                    `
                                      flex shrink-0 items-center justify-center
                                      rounded-[4px] border transition-colors
                                      block-4 inline-4
                                    `,
                                    isSelected
                                      ? `
                                        border-primary bg-primary
                                        text-primary-foreground
                                      `
                                      : `
                                        border-input bg-background
                                        text-transparent
                                      `,
                                  )}
                                >
                                  {isSelected && (
                                    <IconCheck className="block-3 inline-3" />
                                  )}
                                </span>
                              )}
                              <span className="flex-1 truncate min-inline-0">{option.label}</span>
                              {!isMultiple && isSelected && (
                                <IconCheck className="
                                  shrink-0 text-primary block-4 inline-4
                                "
                                />
                              )}
                            </>
                          )}
                    </ListBoxItem>
                  )
                })}
                {hasNextPage && (
                  <ListBoxLoadMoreItem
                    isLoading={isFetchingNextPage}
                    onLoadMore={onLoadMore ?? (() => {})}
                    className={cn(
                      isFetchingNextPage
                        ? 'py-1.5 text-center text-xs text-muted-foreground'
                        : 'block-px',
                    )}
                  >
                    {loadingMoreIndicator}
                  </ListBoxLoadMoreItem>
                )}
              </ListBox>
            </ScrollArea>
          )}
        </Autocomplete>

        {/* Single slot channel: state slots plus footer, in caller order. */}
        {children}
      </InfiniteSelectStateContext>
    </div>
  )
}

// ── Footer actions (clear/close): the context lives in this base layer because
//    infinite-combobox already imports this file — hosting the hook up there
//    would make the import cycle. The combobox only fills the value. ──

/** Selection actions available inside the footer. The combobox supplies them. */
export interface InfiniteSelectActions<T = unknown> {
  /** Selected item objects — loaded pages only. */
  selectedItems: T[]
  /** Selected ids — the authoritative set, unloaded pages included. */
  selectedIds: string[]
  clear: () => void
  close: () => void
}

const InfiniteSelectActionsContext = createContext<InfiniteSelectActions | null>(null)

/** The combobox wraps the panel with this to feed the footer subtree. */
export function InfiniteSelectActionsProvider<T>({ value, children }: {
  value: InfiniteSelectActions<T>
  children: ReactNode
}): ReactElement {
  return (
    <InfiniteSelectActionsContext value={value as InfiniteSelectActions}>
      {children}
    </InfiniteSelectActionsContext>
  )
}

/** Read clear/close/current selection inside the footer. Throws elsewhere. */
export function useInfiniteSelectActions<T = unknown>(): InfiniteSelectActions<T> {
  const ctx = use(InfiniteSelectActionsContext)
  if (!ctx)
    throw new Error('useInfiniteSelectActions must be used inside an InfiniteSelect footer')
  return ctx as InfiniteSelectActions<T>
}

/** Bottom action bar. Place last in the slot children so it lands at the bottom. */
export function InfiniteSelectFooter({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('flex items-center border-bs border-border', className)}
      data-slot="infinite-select-footer"
      {...props}
    />
  )
}

/** Divider between footer actions. Vertical, sized by the footer's height. */
export function InfiniteSelectFooterSeparator({ className, ...props }: ComponentProps<typeof Separator>): ReactElement {
  return (
    <Separator
      className={className}
      data-slot="infinite-select-footer-separator"
      orientation="vertical"
      {...props}
    />
  )
}

/** Clears the selection and closes the popover. Label via children. */
export function InfiniteSelectClearButton({ className, onPress, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { clear, close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-es-lg', className)}
      data-slot="infinite-select-clear"
      onPress={(event) => {
        clear()
        close()
        onPress?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}

/** Closes the popover (which commits the draft under commitOnClose). */
export function InfiniteSelectConfirmButton({ className, onPress, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-ee-lg', className)}
      data-slot="infinite-select-confirm"
      onPress={(event) => {
        close()
        onPress?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}
