'use client'

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from 'react'
import type { Selection } from 'react-aria-components'
import type { ScrollAreaScrollbars } from './scroll-area'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import { Button } from '@gedatou/cadenza-ui/primitives/button'
import { Separator } from '@gedatou/cadenza-ui/primitives/separator'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useEffect, useRef } from 'react'
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  SearchField,
} from 'react-aria-components'
import { ScrollArea } from './scroll-area'

/**
 * Searchable infinite-scrolling list panel, single or multi select.
 *
 * React Aria owns the behaviour: `Autocomplete` wires the search input to the
 * list with virtual focus (arrow keys navigate while the input keeps DOM focus)
 * and `ListBox` owns selection semantics. Rows are virtualized with TanStack
 * Virtual — only the visible window plus overscan reaches the DOM, and
 * `onLoadMore` fires as the window nears the loaded tail. The panel itself
 * renders zero copy — state messages come in through the slot children
 * (`InfiniteSelectEmpty` / `Loading` / `Error`), so i18n stays in
 * the caller's layer.
 */
export interface InfiniteSelectOption {
  id: string
  label: ReactNode
  /** Typeahead text. Required when `label` is not a plain string. */
  textValue?: string
  isDisabled?: boolean
}

/**
 * Context handed to a custom item renderer. Unlike the DOM-level version this
 * replaces the row *content*, not the row: the `ListBoxItem` shell stays, so
 * keyboard navigation and selection wiring survive the override.
 */
export interface InfiniteSelectItemRenderParams<T> {
  item: T
  option: InfiniteSelectOption
  /**
   * Position in the currently loaded (server-filtered) list — a display
   * ordinal for ranks and zebra striping, not an identity: searching reshuffles
   * it. Identity is `option.id`. Provided because CSS ordinal selectors cannot
   * work across a virtualized window.
   */
  index: number
  // React Aria render-prop vocabulary (ListBoxItemRenderProps).
  isSelected: boolean
  selectionMode: 'single' | 'multiple'
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
  /** Root accessible name; the List part falls back to it. */
  'aria-label'?: string
  'items': T[]

  'isLoading'?: boolean
  'isFetchingNextPage'?: boolean
  'hasNextPage'?: boolean
  'isError'?: boolean

  'onLoadMore'?: () => void
  'onRetry'?: () => void

  // RAC ComboBox vocabulary for the embedded search field. The root hosts
  // RAC's Autocomplete, which context-wires any SearchField / ListBox
  // descendants — that is what lets the parts compose freely as children.
  'inputValue'?: string
  'onInputChange'?: (value: string) => void

  'getOption': (item: T) => InfiniteSelectOption

  'className'?: string
  /**
   * The composition channel, React Aria-style: parts
   * (`InfiniteSelectSearch` / `InfiniteSelectList`), state slots
   * (`InfiniteSelectEmpty` / `Loading` / `Error`) and the footer bar, in
   * caller order. The base renders no copy — and no parts — of its own.
   */
  'children'?: ReactNode
}

/** Props of the search-field part. */
export interface InfiniteSelectSearchProps {
  /** Placeholder text, doubling as the field's accessible name. */
  placeholder?: string
  /**
   * Focus the input on mount. Off by default (an inline panel must not steal
   * page focus); popover hosts pass it so typing works the moment the panel
   * opens — `InfiniteCombobox` does.
   */
  autoFocus?: boolean
  className?: string
}

/** Props of the option-list part. */
export interface InfiniteSelectListProps<T = unknown> {
  /** Accessible name for the listbox. Falls back to the root `aria-label`. */
  'aria-label'?: string
  /** Replaces the default row content while keeping RAC selection and focus. */
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  /**
   * Rendered inside the list, at the end of the scrolled content, while the
   * next page is fetching. In-flow on purpose: prefetch fires a viewport ahead,
   * so a user at the top never sees it — only someone at the bottom, exactly
   * when it is relevant. Position is the part's call, which is why this is a
   * prop and not a slot child.
   */
  'loadingMoreIndicator'?: ReactNode
  /**
   * How far ahead of the visible bottom the next page starts loading, in
   * viewport heights (the RAC sentinel's `scrollOffset` semantics). Larger
   * values make the loading state rarer at the cost of eager requests.
   */
  'loadMoreScrollOffset'?: number
  'maxListHeight'?: number
  /** Scrollbar visibility for the list: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /**
   * Virtualize rows with TanStack Virtual: only the visible window plus
   * overscan reaches the DOM. Off by default — turn on for large loaded sets
   * (thousands of rows). Trade-offs while on: rows are fixed-height
   * (`rowHeight`), and typeahead / Home / End / aria-setsize operate on the
   * rendered window instead of the loaded set.
   */
  'virtualized'?: boolean
  /**
   * Fixed pixel height of every virtualized row. Heights come from this
   * number, never from DOM measurement, so a custom `renderItem` taller than
   * the default must set it accordingly. Ignored when `virtualized` is off.
   */
  'rowHeight'?: number
  'className'?: string
}

/**
 * Controlled/uncontrolled selection props, discriminated on `selectionMode`
 * (React Aria's enum, same as our DataTable — never a `multiple` boolean).
 */
export type ControllableSelectionProps<TItem = unknown>
  = | {
    selectionMode: 'multiple'
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
    selectionMode?: 'single'
    value?: string
    defaultValue?: string
    onChange?: (item: TItem | undefined) => void
  }

export type InfiniteSelectProps<T> = InfiniteSelectCommonProps<T> & ControllableSelectionProps<T>

// ── Hooks layer (React Aria's useXxxState pattern): the selection state that
//    drives the panel, exported for headless composition. ──

export interface InfiniteSelectSelectionState<T> {
  /** The authoritative selection — unloaded pages included. */
  selectedIds: string[]
  /** Selected item objects, loaded pages only (cross-page cache). */
  selectedItems: T[]
  /** Feed RAC's `onSelectionChange` with this. */
  onSelectionChange: (selection: Selection) => void
}

/**
 * Controllable selection + the cross-page item cache + the RAC `Selection` →
 * business `onChange` translation. `InfiniteSelect` consumes it internally;
 * a custom composition can drive its own `ListBox` with it.
 */
export function useInfiniteSelectSelection<T>(
  options: ControllableSelectionProps<T> & {
    items: T[]
    getOption: (item: T) => InfiniteSelectOption
  },
): InfiniteSelectSelectionState<T> {
  const { items, getOption } = options
  const isMultiple = options.selectionMode === 'multiple'

  // Controlled-ness is key presence, not `!== undefined` — a controlled single
  // select passes `value={undefined}` for "nothing selected". Normalizing to
  // arrays BEFORE the hook turns that undefined into a controlled [], which is
  // what useControllableState's value-presence convention needs.
  const normalizeIds = (value: string | string[] | undefined): string[] => {
    if (value === undefined)
      return []
    return Array.isArray(value) ? value : [value]
  }
  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: 'value' in options ? normalizeIds(options.value) : undefined,
    defaultValue: 'defaultValue' in options ? normalizeIds(options.defaultValue) : undefined,
    fallback: [],
  })

  // `ids` from onSelectionChange is authoritative; this cache only echoes item
  // objects for ids whose page happens to be loaded. Search can swap `items`
  // wholesale, so selected objects are remembered across pages here.
  const selectedItemsCacheRef = useRef<Map<string, T>>(new Map())
  if (isMultiple) {
    for (const item of items) {
      const id = getOption(item).id
      if (selectedIds.includes(id))
        selectedItemsCacheRef.current.set(id, item)
    }
  }

  const onSelectionChange = (selection: Selection): void => {
    const ids = selection === 'all'
      ? items.map(item => getOption(item).id)
      : [...selection].map(String)
    // Controlled mode makes this a no-op (the hook only mirrors props there).
    setSelectedIds(ids)

    if (options.selectionMode === 'multiple') {
      for (const item of items) {
        const id = getOption(item).id
        if (ids.includes(id))
          selectedItemsCacheRef.current.set(id, item)
      }
      // Map 迭代器允许边遍历边删,无需先拷贝
      for (const id of selectedItemsCacheRef.current.keys()) {
        if (!ids.includes(id))
          selectedItemsCacheRef.current.delete(id)
      }
      const nextItems = ids
        .map(id => selectedItemsCacheRef.current.get(id))
        .filter((entry): entry is T => entry !== undefined)
      options.onChange?.(nextItems, ids)
      return
    }

    const id = ids[0]
    options.onChange?.(id === undefined ? undefined : items.find(item => getOption(item).id === id))
  }

  const selectedItems = selectedIds
    .map(id => selectedItemsCacheRef.current.get(id))
    .filter((entry): entry is T => entry !== undefined)

  return { selectedIds, selectedItems, onSelectionChange }
}

// ── Wiring context: the root provides data + selection, the parts consume —
//    React Aria's context-wiring pattern, so parts compose in caller order
//    as plain children. ──

export interface InfiniteSelectContextValue<T = unknown> {
  'items': T[]
  'getOption': (item: T) => InfiniteSelectOption
  'selectionMode': 'single' | 'multiple'
  'selectedIds': string[]
  'onSelectionChange': (selection: Selection) => void
  /** The list has rows to show (loaded, no error, non-empty). */
  'hasItems': boolean
  'hasNextPage': boolean
  'isFetchingNextPage': boolean
  'onLoadMore'?: (() => void) | undefined
  /** Root-level accessible name — the List part's fallback. */
  'aria-label'?: string | undefined
}

const InfiniteSelectContext = createContext<InfiniteSelectContextValue | null>(null)

/** Read the panel wiring inside custom parts. Throws outside `InfiniteSelect`. */
export function useInfiniteSelectContext<T = unknown>(): InfiniteSelectContextValue<T> {
  const ctx = use(InfiniteSelectContext)
  if (!ctx)
    throw new Error('useInfiniteSelectContext must be used inside InfiniteSelect')
  return ctx as InfiniteSelectContextValue<T>
}

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
    inputValue,
    onInputChange,
    getOption,
    'aria-label': ariaLabel,
    className,
    children,
  } = props

  const selectionMode = props.selectionMode ?? 'single'
  const { selectedIds, onSelectionChange } = useInfiniteSelectSelection<T>(props)

  // States are mutually exclusive; the scrolling list only exists with results.
  const isEmpty = !isLoading && !isError && items.length === 0
  const hasItems = !isLoading && !isError && items.length > 0

  const contextValue: InfiniteSelectContextValue<T> = {
    items,
    getOption,
    selectionMode,
    selectedIds,
    onSelectionChange,
    hasItems,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    'aria-label': ariaLabel,
  }

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
        <InfiniteSelectContext value={contextValue as InfiniteSelectContextValue}>
          <Autocomplete inputValue={inputValue} onInputChange={onInputChange}>
            {children}
          </Autocomplete>
        </InfiniteSelectContext>
      </InfiniteSelectStateContext>
    </div>
  )
}

/** The search-field part: RAC `SearchField` + `Input`, wired to the List by the root's `Autocomplete`. */
export function InfiniteSelectSearch({
  placeholder = 'Search',
  autoFocus = false,
  className,
}: InfiniteSelectSearchProps): ReactElement {
  return (
    <SearchField
      aria-label={placeholder}
      className={cn('flex items-center gap-2 border-be border-border px-3', className)}
      data-slot="infinite-select-search"
    >
      <IconSearch className="shrink-0 text-muted-foreground block-4 inline-4" />
      <Input
        className="
          flex-1 bg-transparent py-2 text-sm/5 text-popover-foreground
          outline-none min-inline-0
          placeholder:text-muted-foreground
          [&::-webkit-search-cancel-button]:appearance-none
        "
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
    </SearchField>
  )
}

/** The option-list part: ScrollArea + RAC `ListBox`, TanStack-virtualized on demand. */
export function InfiniteSelectList<T = unknown>(props: InfiniteSelectListProps<T>): ReactElement | null {
  const {
    renderItem,
    loadingMoreIndicator,
    loadMoreScrollOffset = 1,
    maxListHeight = 256,
    scrollbars,
    virtualized = false,
    rowHeight = 32,
    className,
    'aria-label': ariaLabelProp,
  } = props

  const ctx = useInfiniteSelectContext<T>()
  const {
    items,
    getOption,
    selectionMode,
    selectedIds,
    onSelectionChange,
    hasItems,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  } = ctx
  const isMultiple = selectionMode === 'multiple'
  const ariaLabel = ariaLabelProp ?? ctx['aria-label']

  // When virtualized, TanStack Virtual owns windowing and positioning while
  // RAC keeps the semantics. Rows are uniform (rowHeight): no DOM measurement,
  // no correction pass. The generous overscan keeps arrow-key navigation
  // fluid — focus advancing into the overscan scrolls, which shifts the
  // window before focus can reach its edge. The hook must run unconditionally
  // (rules of hooks); count 0 keeps it inert when virtualization is off.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: virtualized ? items.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey: index => getOption(items[index]).id,
    gap: 2,
    paddingStart: 4,
    paddingEnd: 4,
    overscan: 12,
    initialRect: { width: 288, height: maxListHeight },
  })
  const virtualItems = virtualizer.getVirtualItems()

  // Virtualized load-more, the TanStack way: fire when the overscan window
  // nears the loaded tail. The trigger distance mirrors the RAC sentinel used
  // in the non-virtual path: fire while less than `loadMoreScrollOffset`
  // viewports of unrendered content remain below the window. Adapters are
  // expected to dedupe repeat calls, as react-query's fetchNextPage does.
  const lastVirtualEnd = virtualItems.at(-1)?.end
  useEffect(() => {
    if (!virtualized || !hasNextPage || isFetchingNextPage || lastVirtualEnd === undefined)
      return
    if (virtualizer.getTotalSize() - lastVirtualEnd <= loadMoreScrollOffset * maxListHeight)
      onLoadMore?.()
  }, [virtualized, hasNextPage, isFetchingNextPage, lastVirtualEnd, loadMoreScrollOffset, maxListHeight, virtualizer, onLoadMore])

  const renderOption = (item: T, index: number, style?: CSSProperties): ReactElement => {
    const option = getOption(item)
    return (
      <ListBoxItem
        key={option.id}
        style={style}
        className={cn(
          `
            flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5
            text-sm/5 text-popover-foreground transition-colors outline-none
            select-none
          `,
          `
            data-focused:bg-muted
            data-hovered:bg-muted
            data-pressed:translate-y-px
            data-selected:bg-muted/50
            data-selected:data-focused:bg-muted
            data-selected:data-hovered:bg-muted
          `,
          `data-disabled:cursor-not-allowed data-disabled:opacity-50`,
        )}
        data-slot="infinite-select-item"
        id={option.id}
        isDisabled={option.isDisabled}
        textValue={option.textValue ?? (typeof option.label === 'string' ? option.label : option.id)}
      >
        {({ isSelected }) => renderItem
          ? renderItem({ item, option, index, isSelected, selectionMode })
          : (
              <>
                {isMultiple && (
                  <span
                    aria-hidden
                    data-slot="infinite-select-checkbox"
                    className={cn(
                      `
                        flex shrink-0 items-center justify-center rounded-[4px]
                        border transition-colors block-4 inline-4
                      `,
                      isSelected
                        ? `border-primary bg-primary text-primary-foreground`
                        : `border-input bg-background text-transparent`,
                    )}
                  >
                    {isSelected && (
                      <IconCheck className="block-3 inline-3" />
                    )}
                  </span>
                )}
                <span className="flex-1 truncate min-inline-0">{option.label}</span>
                {!isMultiple && isSelected && (
                  <IconCheck className="shrink-0 text-primary block-4 inline-4" />
                )}
              </>
            )}
      </ListBoxItem>
    )
  }

  if (!hasItems)
    return null

  return (
    <ScrollArea
      className={className}
      scrollbars={scrollbars}
      viewportClassName="scroll-fade-y"
      viewportRef={scrollRef}
      viewportStyle={{ maxHeight: maxListHeight }}
    >
      <ListBox
        aria-label={ariaLabel}
        data-slot="infinite-select-list"
        selectionMode={isMultiple ? 'multiple' : 'single'}
        // useListBox 支持但 RAC 1.19 类型漏了(运行时 ...props 透传)。
        // 默认 'clearSelection' 让 Esc 清空选择——在 commitOnClose 下
        // 意味着"清空草稿并提交空集"。Esc 的语义应该是关闭,不是清空。
        {...{ escapeKeyBehavior: 'none' }}
        className={cn(
          'outline-none',
          virtualized ? 'relative' : 'flex flex-col gap-0.5 p-1',
        )}
        style={virtualized ? { height: virtualizer.getTotalSize() } : undefined}
        selectedKeys={selectedIds}
        onSelectionChange={onSelectionChange}
      >
        {virtualized
          ? virtualItems.map(virtualItem => renderOption(items[virtualItem.index], virtualItem.index, {
              position: 'absolute',
              top: 0,
              insetInline: 4,
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }))
          : items.map((item, index) => renderOption(item, index))}
        {!virtualized && hasNextPage && (
          <ListBoxLoadMoreItem
            isLoading={isFetchingNextPage}
            onLoadMore={onLoadMore ?? (() => {})}
            scrollOffset={loadMoreScrollOffset}
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
      {virtualized && isFetchingNextPage && loadingMoreIndicator !== undefined && (
        <div
          className="py-1.5 text-center text-xs text-muted-foreground"
          data-slot="infinite-select-loading-more"
        >
          {loadingMoreIndicator}
        </div>
      )}
    </ScrollArea>
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
    <InfiniteSelectActionsContext value={value}>
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
