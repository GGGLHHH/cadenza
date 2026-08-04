'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { LoadingOverlayProps } from './loading-overlay'
import type { ScrollAreaScrollbars } from './scroll-area'
import { Combobox } from '@base-ui/react/combobox'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useEffect, useRef } from 'react'
import { findComposedPart } from '#lib/find-part'
import { cn } from '#lib/utils'
import { Button } from '#primitives/button'
import { Separator } from '#primitives/separator'
import { LoadingOverlay } from './loading-overlay'
import { ScrollArea } from './scroll-area'
import { Spinner } from './spinner'

/**
 * Searchable infinite-scrolling list panel, single or multi select.
 *
 * Base UI owns the behaviour: `Combobox.Root` in `inline` mode wires the search
 * input to the list with virtual focus (arrow keys navigate while the input
 * keeps DOM focus) and owns selection semantics. Filtering is *off*
 * (`filter={null}`) because it happens on the server — typing drives
 * `onInputChange`, the caller refetches, and the panel renders whatever comes
 * back. Rows can be virtualized with TanStack Virtual, and `onLoadMore` fires
 * from an intersection sentinel that trails the loaded rows. The panel renders
 * zero copy — empty/error messages come in through the slot children
 * (`InfiniteSelectEmpty` / `Error`), so i18n stays in the caller's layer;
 * loading is copyless by design, the List part's frosted `LoadingOverlay`.
 */
export interface InfiniteSelectOption {
  id: string
  label: ReactNode
  disabled?: boolean
}

/**
 * Context handed to a custom item renderer. Unlike the DOM-level version this
 * replaces the row *content*, not the row: the `Combobox.Item` shell stays, so
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
  // Base UI's item-state vocabulary, passed through whole: a custom renderer
  // gets the same states CSS gets as data-*.
  selected: boolean
  disabled: boolean
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

  // The search text. The root hosts Base UI's Combobox, which context-wires any
  // Input / List descendants — that is what lets the parts compose freely as
  // children.
  'inputValue'?: string
  'onInputChange'?: (value: string) => void

  'getOption': (item: T) => InfiniteSelectOption

  /**
   * Virtualize rows with TanStack Virtual: only the visible window plus
   * overscan reaches the DOM. Off by default — a few hundred rows don't need
   * it. Lives on the root rather than the List because Base UI has to know too:
   * with rows missing from the DOM it navigates by the value list instead of by
   * DOM order.
   */
  'virtualized'?: boolean
  /**
   * Fixed pixel height of every virtualized row. Heights come from this number,
   * never from DOM measurement, so a custom `renderItem` taller than the default
   * must set it accordingly. Ignored when `virtualized` is off.
   */
  'rowHeight'?: number

  'className'?: string
  /**
   * The composition channel: parts (`InfiniteSelectSearch` /
   * `InfiniteSelectList`), state slots (`InfiniteSelectEmpty` / `Error`) and
   * the footer bar, in caller order. The base renders no copy — and no parts —
   * of its own.
   */
  'children'?: ReactNode
}

/**
 * Props of the search-field part. `value` / `onChange` are not reopened here:
 * the root owns the query and the input claims it from context, so a second
 * channel would only be a way to sever it.
 */
export interface InfiniteSelectSearchProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Placeholder for the default input, doubling as the field's accessible
   * name. No default copy: the base renders zero visible text of its own.
   * Without it (and without an `aria-label`) the accessible name falls back
   * to `'Search'` — a safety net, not copy, since it never renders.
   */
  placeholder?: string
  /**
   * Focus the input on mount. Off by default (an inline panel must not steal
   * page focus); popover hosts pass it so typing works the moment the panel
   * opens — `InfiniteCombobox` does.
   */
  autoFocus?: boolean
  /** Replaces the default composition (icon + input). */
  children?: ReactNode
}

/** Props of the option-list part. */
export interface InfiniteSelectListProps<T = unknown> {
  /** Accessible name for the listbox. Falls back to the root `aria-label`. */
  'aria-label'?: string
  /**
   * Replaces the default row content while keeping selection and focus.
   *
   * The keyboard/pointer highlight is deliberately absent from the params: it is
   * Base UI's to own and it is not readable during render. Style it off
   * `data-highlighted` on the row instead — that is the real API.
   */
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  /**
   * How far ahead of the visible bottom the next page starts loading, in
   * viewport heights. Larger values make the loading state rarer at the cost of
   * eager requests.
   */
  'loadMoreScrollOffset'?: number
  'maxListHeight'?: number
  /** Scrollbar visibility for the list: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /** Class for the scroll container around the list. */
  'className'?: string
  /** Class for the listbox element itself. */
  'listClassName'?: string
  /** Class for every row. Function form receives Base UI's item state. */
  'itemClassName'?: ComponentProps<typeof Combobox.Item>['className']
}

/**
 * Controlled/uncontrolled selection props, discriminated on `selectionMode`
 * (an enum, same as our DataTable — never a `multiple` boolean).
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

// ── Hooks layer: the selection state that drives the panel, exported for
//    headless composition. ──

export interface InfiniteSelectSelectionState<T> {
  /** The authoritative selection — unloaded pages included. */
  selectedIds: string[]
  /** Selected item objects, loaded pages only (cross-page cache). */
  selectedItems: T[]
  /** Feed Base UI's `onValueChange` with this. */
  onValueChange: (value: string | string[] | null) => void
}

/**
 * Controllable selection + the cross-page item cache + the Base UI value →
 * business `onChange` translation. `InfiniteSelect` consumes it internally;
 * a custom composition can drive its own list with it.
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

  // `ids` from onValueChange is authoritative; this cache only echoes item
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

  const onValueChange = (value: string | string[] | null): void => {
    const ids = value === null ? [] : Array.isArray(value) ? value : [value]
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

  return { selectedIds, selectedItems, onValueChange }
}

// ── Wiring context: the root provides data + selection, the parts consume, so
//    parts compose in caller order as plain children. ──

export interface InfiniteSelectContextValue<T = unknown> {
  'items': T[]
  'getOption': (item: T) => InfiniteSelectOption
  'selectionMode': 'single' | 'multiple'
  'selectedIds': string[]
  /** The list has rows to show (loaded, no error, non-empty). */
  'hasItems': boolean
  'hasNextPage': boolean
  'isFetchingNextPage': boolean
  'onLoadMore'?: (() => void) | undefined
  'virtualized': boolean
  'rowHeight': number
  /** Root-level accessible name — the List part's fallback. */
  'aria-label'?: string | undefined
  /** Lifted from a composed `InfiniteSelectLoadingOverlay`; the List renders it. */
  'loadingOverlayProps'?: InfiniteSelectLoadingOverlayProps | undefined
  /** Lifted from a composed `InfiniteSelectNoMore`; the List renders it. */
  'noMoreProps'?: InfiniteSelectNoMoreProps | undefined
  /** Lifted from a composed `InfiniteSelectLoadingMore`; the List renders it. */
  'loadingMoreProps'?: InfiniteSelectLoadingMoreProps | undefined
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

export type InfiniteSelectLoadingOverlayProps = Omit<LoadingOverlayProps, 'isLoading'>

/**
 * Slotted customization for the built-in loading overlay: compose it anywhere
 * in the panel's children and the List part renders your props over the list
 * region — `children` replace the centred spinner, `className` tunes the
 * frost. A marker like TabIndicator: it renders nothing where written (an
 * absolute overlay cannot live in the panel's flow), and `isLoading` stays
 * the base's wiring. Direct child or inside a Fragment only — a custom
 * wrapper hides it.
 */
export function InfiniteSelectLoadingOverlay(_props: InfiniteSelectLoadingOverlayProps): null {
  return null
}

export type InfiniteSelectLoadingMoreProps = ComponentProps<'div'>

/**
 * Slotted customization for the next-page indicator: while a page is fetching,
 * the List part renders a row at the end of the scrolled content. The default
 * is a Spinner — a mark, not a sentence, because the base ships zero copy.
 * Compose this to replace it:
 *
 * ```tsx
 * <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
 * ```
 *
 * In-flow on purpose: prefetch fires a viewport ahead, so a user at the top
 * never sees it — only someone at the bottom, exactly when it is relevant.
 *
 * A marker like `InfiniteSelectNoMore`: composing it is customization, not a
 * switch. Leave it out and the Spinner still renders.
 */
export function InfiniteSelectLoadingMore(_props: InfiniteSelectLoadingMoreProps): null {
  return null
}

export type InfiniteSelectNoMoreProps = ComponentProps<'div'>

/**
 * Slotted customization for the end-of-list mark: once every page is loaded,
 * the List part renders a terminal row at the end of the scrolled content so
 * the list visibly *ends* instead of just stopping. The default is a fading
 * rule — a mark, not a sentence, because the base ships zero copy. Compose
 * this to replace it with your own text:
 *
 * ```tsx
 * <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
 * ```
 *
 * A marker like `InfiniteSelectLoadingOverlay`: it renders nothing where
 * written, and composing it is customization, not a switch — leave it out and
 * the default rule still renders. Direct child or inside a Fragment only.
 *
 * It rides the scroll flow *outside* the listbox element, so it never counts
 * as an option: no `aria-setsize` distortion and nothing extra for
 * `getAllByRole('option')` to find.
 */
export function InfiniteSelectNoMore(_props: InfiniteSelectNoMoreProps): null {
  return null
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
export function InfiniteSelectRetry({ onClick, ...props }: ComponentProps<typeof Button>): ReactElement | null {
  const { onRetry } = useInfiniteSelectState()
  if (!onRetry)
    return null
  return (
    <Button
      data-slot="infinite-select-retry"
      onClick={(event) => {
        onRetry()
        onClick?.(event)
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
    virtualized = false,
    rowHeight = 32,
    'aria-label': ariaLabel,
    className,
    children,
  } = props

  const selectionMode = props.selectionMode ?? 'single'
  const isMultiple = selectionMode === 'multiple'
  const { selectedIds, onValueChange } = useInfiniteSelectSelection<T>(props)

  // One loading look everywhere: `isLoading` always renders the List part's
  // frosted LoadingOverlay — over the results when a reload keeps them on
  // screen (react-query placeholderData), over a min-height blank while the
  // first page is still coming. Only errors unmount the list.
  const isEmpty = !isLoading && !isError && items.length === 0
  const hasItems = !isError && items.length > 0

  const contextValue: InfiniteSelectContextValue<T> = {
    items,
    getOption,
    selectionMode,
    selectedIds,
    hasItems,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    virtualized,
    rowHeight,
    'aria-label': ariaLabel,
    'loadingOverlayProps': findComposedPart(children, InfiniteSelectLoadingOverlay),
    'noMoreProps': findComposedPart(children, InfiniteSelectNoMore),
    'loadingMoreProps': findComposedPart(children, InfiniteSelectLoadingMore),
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
          <Combobox.Root
            // `inline` + a pinned `open`: no popup of its own, the list is just
            // part of the panel. A popover host (InfiniteCombobox) provides the
            // overlay around the whole thing instead.
            inline
            open
            // Our filtering is the server's: typing drives onInputChange, the
            // caller refetches, and `items` is already the answer. Leaving Base
            // UI's client filter on would filter the results a second time.
            filter={null}
            inputValue={inputValue}
            items={items.map(item => getOption(item).id)}
            multiple={isMultiple}
            value={isMultiple ? selectedIds : (selectedIds[0] ?? null)}
            virtualized={virtualized}
            onInputValueChange={onInputChange}
            onValueChange={onValueChange}
          >
            {children}
          </Combobox.Root>
        </InfiniteSelectContext>
      </InfiniteSelectStateContext>
    </div>
  )
}

/** The search-field part: Base UI's `Combobox.Input`, wired by the root. */
export function InfiniteSelectSearch({
  placeholder,
  autoFocus = false,
  className,
  children,
  ...props
}: InfiniteSelectSearchProps): ReactElement {
  return (
    <div
      className={cn('flex items-center gap-2 border-be border-border px-3', className)}
      data-slot="infinite-select-search"
      {...props}
    >
      {children ?? (
        <>
          <IconSearch
            className="shrink-0 text-muted-foreground block-4 inline-4"
            data-slot="infinite-select-search-icon"
          />
          <Combobox.Input
            aria-label={placeholder ?? 'Search'}
            autoFocus={autoFocus}
            className="
              flex-1 bg-transparent py-2 text-sm/5 text-popover-foreground
              outline-none min-inline-0
              placeholder:text-muted-foreground
              [&::-webkit-search-cancel-button]:appearance-none
            "
            data-slot="infinite-select-search-input"
            placeholder={placeholder}
            type="search"
          />
        </>
      )}
    </div>
  )
}

/**
 * Fires `onLoadMore` when it scrolls into view, a viewport-height early by
 * default. This is the whole of infinite scroll here: an empty div trailing the
 * rows, *outside* the listbox so it is never mistaken for an option.
 *
 * An observer rather than a scroll handler because the sentinel's position is
 * what matters, not the scroll offset — under virtualization the offset says
 * nothing about how many rows are left.
 */
function LoadMoreSentinel({
  onLoadMore,
  isFetchingNextPage,
  scrollOffset,
}: {
  onLoadMore: (() => void) | undefined
  isFetchingNextPage: boolean
  scrollOffset: number
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  // Read at fire time so a re-render never has to re-arm the observer.
  const latestRef = useRef({ onLoadMore, isFetchingNextPage })
  latestRef.current = { onLoadMore, isFetchingNextPage }

  useEffect(() => {
    const node = ref.current
    const viewport = node?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (!node || !viewport)
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !latestRef.current.isFetchingNextPage)
          latestRef.current.onLoadMore?.()
      },
      { root: viewport, rootMargin: `0px 0px ${scrollOffset * 100}% 0px` },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [scrollOffset])

  return <div aria-hidden data-slot="infinite-select-load-more-sentinel" ref={ref} />
}

/** The option-list part: ScrollArea + Base UI `Combobox.List`, virtualized on demand. */
export function InfiniteSelectList<T = unknown>(props: InfiniteSelectListProps<T>): ReactElement | null {
  const {
    renderItem,
    loadMoreScrollOffset = 1,
    maxListHeight = 256,
    scrollbars,
    className,
    listClassName,
    itemClassName,
    'aria-label': ariaLabelProp,
  } = props

  const ctx = useInfiniteSelectContext<T>()
  const {
    items,
    getOption,
    selectionMode,
    selectedIds,
    hasItems,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    virtualized,
    rowHeight,
    loadingOverlayProps,
    noMoreProps,
    loadingMoreProps,
  } = ctx
  const { isLoading } = useInfiniteSelectState()
  const isMultiple = selectionMode === 'multiple'
  const ariaLabel = ariaLabelProp ?? ctx['aria-label']

  const viewportRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: virtualized ? items.length : 0,
    estimateSize: () => rowHeight,
    getScrollElement: () => viewportRef.current,
    // The viewport's height is `maxListHeight` until it is measured. Without
    // this the first window is computed against a zero-height rect and renders
    // nothing — on the server, and anywhere ResizeObserver has not fired yet.
    initialRect: { width: 0, height: maxListHeight },
    overscan: 8,
  })
  const virtualItems = virtualizer.getVirtualItems()

  const renderOption = (item: T, index: number): ReactElement => {
    const option = getOption(item)
    const isSelected = selectedIds.includes(option.id)
    return (
      <Combobox.Item
        key={option.id}
        className={cn(
          `
            flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5
            text-sm/5 text-popover-foreground transition-colors outline-none
            select-none
          `,
          `
            data-highlighted:bg-muted
            data-selected:bg-muted/50
            data-selected:data-highlighted:bg-muted
          `,
          `data-disabled:cursor-not-allowed data-disabled:opacity-50`,
          itemClassName,
        )}
        data-slot="infinite-select-item"
        disabled={option.disabled}
        value={option.id}
      >
        {renderItem
          ? renderItem({
              item,
              option,
              index,
              selected: isSelected,
              disabled: option.disabled ?? false,
              selectionMode,
            })
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
                    {isSelected && <IconCheck className="block-3 inline-3" />}
                  </span>
                )}
                <span className="flex-1 truncate min-inline-0">{option.label}</span>
                {!isMultiple && isSelected && (
                  <IconCheck className="shrink-0 text-primary block-4 inline-4" />
                )}
              </>
            )}
      </Combobox.Item>
    )
  }

  // First page still coming: nothing exists to size the list yet, so the
  // shell gets a minimum height for the frosted overlay to show on. Same
  // look as a refresh — one loading visual everywhere.
  if (!hasItems) {
    return isLoading
      ? (
          <div className="relative min-block-24" data-slot="infinite-select-list-container">
            <LoadingOverlay {...loadingOverlayProps} isLoading />
          </div>
        )
      : null
  }

  return (
    // The overlay must cover the visible viewport, not scroll with the rows —
    // hence the positioned shell around the ScrollArea rather than inside it.
    // The search field stays outside on purpose: typing is what drives the
    // refresh, covering the input would interrupt it.
    <div className="relative" data-slot="infinite-select-list-container">
      <ScrollArea
        className={className}
        scrollbars={scrollbars}
        viewportClassName="scroll-fade-y overscroll-contain"
        viewportRef={viewportRef}
        viewportStyle={{ maxHeight: maxListHeight }}
      >
        <Combobox.List
          aria-label={ariaLabel}
          className={cn(
            'flex flex-col gap-0.5 p-1 outline-none',
            virtualized && 'relative block gap-0 p-0',
            listClassName,
          )}
          data-slot="infinite-select-list"
        >
          {virtualized
            ? (
                <div className="relative inline-full" style={{ height: virtualizer.getTotalSize() }}>
                  {virtualItems.map(virtualItem => (
                    <div
                      key={virtualItem.key}
                      className="absolute inset-s-0 px-1 inline-full"
                      style={{ height: virtualItem.size, transform: `translateY(${virtualItem.start}px)` }}
                    >
                      {renderOption(items[virtualItem.index], virtualItem.index)}
                    </div>
                  ))}
                </div>
              )
            : items.map((item, index) => renderOption(item, index))}
        </Combobox.List>

        {hasNextPage
          ? (
              <>
                <LoadMoreSentinel
                  isFetchingNextPage={isFetchingNextPage}
                  scrollOffset={loadMoreScrollOffset}
                  onLoadMore={onLoadMore}
                />
                {isFetchingNextPage && (
                  <div
                    data-slot="infinite-select-load-more"
                    {...loadingMoreProps}
                    className={cn(
                      `
                        flex items-center justify-center py-1.5 text-center
                        text-xs text-muted-foreground
                      `,
                      loadingMoreProps?.className,
                    )}
                  >
                    {/* A default, not an optional extra: without it the next
                        page would arrive with no feedback at all. A Spinner is
                        the copyless default, same rule as LoadingOverlay. */}
                    {loadingMoreProps?.children ?? (
                      <Spinner
                        aria-hidden
                        className="block-3.5 inline-3.5"
                      />
                    )}
                  </div>
                )}
              </>
            )
          : (
              // Every page is in: the list visibly ends instead of just stopping.
              <div
                data-slot="infinite-select-no-more"
                {...noMoreProps}
                className={cn(
                  `
                    flex items-center justify-center py-3 text-center text-xs
                    text-muted-foreground
                  `,
                  noMoreProps?.className,
                )}
              >
                {noMoreProps?.children ?? (
                  <span
                    aria-hidden
                    className={`
                      bg-linear-to-r from-transparent via-muted-foreground/40
                      to-transparent block-px inline-24
                    `}
                    data-slot="infinite-select-no-more-rule"
                  />
                )}
              </div>
            )}
      </ScrollArea>
      <LoadingOverlay {...loadingOverlayProps} isLoading={isLoading} />
    </div>
  )
}

// ── Footer actions (clear/close): the context lives in this base layer because
//    infinite-combobox already imports this file — hosting the hook up there
//    would make the import cycle. The combobox only fills the value. ──

/** Selection actions available inside the footer. The combobox supplies them. */
export interface InfiniteSelectActions<T = unknown> {
  /** Currently selected item objects (loaded pages only). */
  selectedItems: T[]
  /** Authoritative selected ids. */
  selectedIds: string[]
  /** Clear the selection. */
  clear: () => void
  /** Close the popover host, if there is one. */
  close: () => void
}

const InfiniteSelectActionsContext = createContext<InfiniteSelectActions | null>(null)

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

export function useInfiniteSelectActions<T = unknown>(): InfiniteSelectActions<T> {
  const ctx = use(InfiniteSelectActionsContext)
  if (!ctx)
    throw new Error('Footer actions must be used inside an InfiniteCombobox')
  return ctx as InfiniteSelectActions<T>
}

/** Footer bar: the row of actions under the list. */
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
export function InfiniteSelectClearButton({ className, onClick, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { clear, close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-es-lg', className)}
      data-slot="infinite-select-clear"
      onClick={(event) => {
        clear()
        close()
        onClick?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}

/** Closes the popover (which commits the draft under commitOnClose). */
export function InfiniteSelectConfirmButton({ className, onClick, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-ee-lg', className)}
      data-slot="infinite-select-confirm"
      onClick={(event) => {
        close()
        onClick?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}
