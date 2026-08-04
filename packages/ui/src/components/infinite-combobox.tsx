'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { ControllableSelectionProps, InfiniteSelectActions, InfiniteSelectAdapterProps, InfiniteSelectItemRenderParams, InfiniteSelectOption } from './infinite-select'
import type { ScrollAreaScrollbars } from './scroll-area'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { useDebounceFn } from 'ahooks'
import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '#lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '#primitives/popover'
import {
  InfiniteSelect,
  InfiniteSelectActionsProvider,
  InfiniteSelectList,
  InfiniteSelectSearch,
} from './infinite-select'

/**
 * Popover wrapper for `InfiniteSelect`: Base UI's `Popover` owns open state,
 * focus restore and dismissal; this layer adds the search/query split with
 * debounce, and an optional commit-on-close draft mode for multi selection.
 */

// `open`/`defaultOpen`/`onOpenChange` for the overlay and
// `inputValue`/`defaultInputValue`/`onInputChange` for the search text.
// `queryValue` — the debounced value meant for the request — is our own.
export interface InfiniteComboboxStateOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  inputValue?: string
  defaultInputValue?: string
  onInputChange?: (value: string) => void
  /** The debounced value meant for the actual request. */
  queryValue?: string
  defaultQueryValue?: string
  onQueryValueChange?: (value: string | undefined) => void
  debounceMs?: number
}

export interface InfiniteComboboxState<T = unknown> {
  open: boolean
  setOpen: (open: boolean) => void
  inputValue: string
  setInputValue: (value: string) => void
  resetSearch: () => void
  queryValue: string | undefined
  selectedValue?: string | string[] | undefined
  selectedItems?: T[]
}

export function useInfiniteComboboxState({
  open,
  defaultOpen,
  onOpenChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  queryValue,
  defaultQueryValue,
  onQueryValueChange,
  debounceMs = 300,
}: InfiniteComboboxStateOptions = {}): InfiniteComboboxState {
  const [openState, setOpenState] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    fallback: false,
  })
  const [inputState, setInputState] = useControllableState({
    value: inputValue,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
    fallback: '',
  })
  const [queryState, setQueryState] = useControllableState<string | undefined>({
    value: queryValue,
    defaultValue: defaultQueryValue,
    ...(onQueryValueChange ? { onChange: onQueryValueChange } : {}),
  })

  // `debounceMs` is read at mount: ahooks builds the debounce once.
  const { run: commitQueryValue, cancel: cancelQueryValue } = useDebounceFn(
    setQueryState,
    { wait: debounceMs },
  )

  const setInputValue = useCallback(
    (value: string) => {
      setInputState(value)
      commitQueryValue(value === '' ? undefined : value)
    },
    [commitQueryValue, setInputState],
  )

  const resetSearch = useCallback(() => {
    cancelQueryValue()
    setInputState('')
    setQueryState(undefined)
  }, [cancelQueryValue, setInputState, setQueryState])

  // Stale search from the previous session resets on the next open, not on
  // close — resetting while the exit animation plays would flash the full list.
  const shouldResetOnNextOpenRef = useRef(false)
  const prevOpenRef = useRef<boolean | undefined>(undefined)

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && shouldResetOnNextOpenRef.current) {
        resetSearch()
        shouldResetOnNextOpenRef.current = false
      }
      if (!nextOpen)
        shouldResetOnNextOpenRef.current = true
      setOpenState(nextOpen)
    },
    [resetSearch, setOpenState],
  )

  // Covers externally-controlled `open` flips that bypass setOpen.
  useLayoutEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = openState

    if (wasOpen === true && !openState) {
      shouldResetOnNextOpenRef.current = true
      return
    }
    if (wasOpen === false && openState && shouldResetOnNextOpenRef.current) {
      resetSearch()
      shouldResetOnNextOpenRef.current = false
    }
  }, [openState, resetSearch])

  return {
    open: openState,
    queryValue: queryState,
    resetSearch,
    inputValue: inputState,
    setOpen,
    setInputValue,
  }
}

// `ReactNode[]` is spelled out even though `ReactNode` already covers iterables:
// TypeScript only allows multiple JSX children when the children type is itself
// an array type, and it will not look inside `Iterable<ReactNode>` to find one.
export type InfiniteComboboxChildren<T>
  = | ReactNode
    | ReactNode[]
    | ((params: InfiniteComboboxState<T> & { disabled: boolean }) => ReactElement)

interface InfiniteComboboxCommonProps<T> {
  /** Accessible name for the option list. Falls back to `searchPlaceholder`. */
  'aria-label'?: string
  /**
   * Base UI's `Popover.Trigger` contract, by position: **the first child is
   * the trigger, every child after it is the panel's composition channel**
   * (state slots, marker parts, footer) — the same children `InfiniteSelect`
   * takes, minus the Search and List parts this layer already renders.
   *
   * ```tsx
   * <InfiniteCombobox …>
   *   <Button>Pick one</Button>
   *   <InfiniteSelectEmpty>No results</InfiniteSelectEmpty>
   *   <InfiniteSelectFooter>…</InfiniteSelectFooter>
   * </InfiniteCombobox>
   * ```
   *
   * The trigger can be any element: it reaches `Popover.Trigger` as `render`,
   * which merges the trigger's props (id, `aria-expanded`, the click handler)
   * into it. Anything that is not an element — a bare string, say — becomes
   * the content of Base UI's own button instead. Passing a function instead
   * makes the whole of `children` the trigger (it receives the combobox state
   * plus the current selection, for summary rendering) and leaves no panel
   * channel; read `state` directly in your JSX when you need both.
   */
  'children': InfiniteComboboxChildren<T>
  /**
   * `id` for the trigger, so a `FieldLabel htmlFor` can point at it. Base UI's
   * `Popover.Trigger` gives it a generated `base-ui-…` id otherwise, which no
   * caller can predict.
   *
   * Unlike `Select`, no matching `aria-label` is needed: nothing puts an
   * `aria-labelledby` on this trigger, so the native `<label for>` association
   * names it outright. An element that carries its own `id` keeps it.
   */
  'triggerId'?: string
  'state': InfiniteComboboxState
  'list': InfiniteSelectAdapterProps<T>
  'getOption': (item: T) => InfiniteSelectOption
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  'disabled'?: boolean
  'contentClassName'?: string
  /** Multi only: hold toggles as a draft and commit once, when the popover closes. */
  'commitOnClose'?: boolean
  'searchPlaceholder'?: string
  /** Prefetch distance in viewport heights. See InfiniteSelect. */
  'loadMoreScrollOffset'?: number
  'maxListHeight'?: number
  /** Scrollbar visibility for the list: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /** Virtualize rows for large loaded sets. See InfiniteSelect. */
  'virtualized'?: boolean
  /** Fixed row height for the virtualized list. See InfiniteSelect. */
  'rowHeight'?: number
  /** Single only: close the popover after picking. Defaults to true. */
  'closeOnSelect'?: boolean
  /**
   * Lock the page scroll while the popover is open (Base UI's `modal`). Off by
   * default — the page scrolls freely and the popover follows its anchor.
   */
  'lockScroll'?: boolean
  'selectClassName'?: string
  /**
   * The popover shell's positioning surface — `side`, `sideOffset`, `align`
   * and the rest. An object on purpose, not flattened into this panel, and the
   * wiring is written after the spread so it stays in charge.
   * `contentClassName` remains the class outlet.
   */
  'popoverProps'?: Omit<ComponentProps<typeof PopoverContent>, 'children' | 'className'>
}

export type InfiniteComboboxProps<T> = InfiniteComboboxCommonProps<T>
  & ControllableSelectionProps<T>

export function InfiniteCombobox<T>(props: InfiniteComboboxProps<T>): ReactElement {
  const {
    children,
    commitOnClose = false,
    contentClassName,
    disabled = false,
    getOption,
    list,
    maxListHeight,
    scrollbars,
    virtualized,
    rowHeight,
    renderItem,
    searchPlaceholder,
    loadMoreScrollOffset,
    state,
    closeOnSelect = true,
    lockScroll = false,
    selectClassName,
    popoverProps,
    triggerId,
  } = props

  const isMultiple = props.selectionMode === 'multiple'
  const deferredEnabled = isMultiple && commitOnClose

  // Key presence, matching InfiniteSelect: a controlled single select clears with
  // `value={undefined}`, and `controlled ?? internal` would silently fall back to
  // the stale internal pick instead.
  const isValueControlled = 'value' in props
  const [internalValue, setSelectedValue] = useState<string | string[] | undefined>(
    props.defaultValue ?? (isMultiple ? [] : undefined),
  )
  const selectedValue = isValueControlled ? props.value : internalValue
  const externalMultiValue = (props as { value?: string[] }).value
  const externalValueRef = useRef(externalMultiValue)
  externalValueRef.current = externalMultiValue

  const [draftIds, setDraftIds] = useState<string[]>(
    () => externalMultiValue ?? (props.defaultValue as string[] | undefined) ?? [],
  )
  const draftItemsRef = useRef<T[]>([])
  const draftIdsRef = useRef<string[]>([])
  const hasChangedRef = useRef(false)
  const prevOpenRef = useRef<boolean | undefined>(undefined)
  const selectedItemsCacheRef = useRef<Map<string, T>>(new Map())

  const effectiveSelectedValue = deferredEnabled ? draftIds : selectedValue
  const selectedIds = isMultiple
    ? ((effectiveSelectedValue as string[] | undefined) ?? [])
    : effectiveSelectedValue !== undefined
      ? [effectiveSelectedValue as string]
      : []

  for (const item of list.items) {
    const id = getOption(item).id
    if (selectedIds.includes(id))
      selectedItemsCacheRef.current.set(id, item)
  }

  const selectedItems = selectedIds
    .map(id => selectedItemsCacheRef.current.get(id))
    .filter((entry): entry is T => entry !== undefined)

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = state.open
    if (!deferredEnabled)
      return

    const justClosed = wasOpen === true && !state.open
    const justCommitted = justClosed && hasChangedRef.current
    if (justCommitted) {
      // draftIdsRef is authoritative (from InfiniteSelect); draftItemsRef only
      // echoes the loaded ones.
      const ids = draftIdsRef.current
      setSelectedValue(ids)
      ;(props as { onChange?: (items: T[], ids: string[]) => void }).onChange?.(
        draftItemsRef.current,
        ids,
      )
      hasChangedRef.current = false
    }

    // Don't reset to the external value right after committing: the parent
    // hasn't applied our onChange yet, so externalValueRef is stale — draftIds
    // already holds the committed ids.
    if (!justCommitted && (wasOpen === undefined || justClosed)) {
      const externalValue = externalValueRef.current
      if (externalValue !== undefined) {
        setDraftIds(externalValue)
        if (!justClosed)
          hasChangedRef.current = false
      }
    }
  }, [deferredEnabled, props, setSelectedValue, state.open])

  // Set below, where the trigger's id is resolved — a ref because the handler
  // is created before that and must still see the current value.
  const labelTargetIdRef = useRef<string | undefined>(undefined)

  /**
   * Open/close, with one exception written in: **the associated `<label>` is
   * not "outside".**
   *
   * A non-modal popover shields nothing, so a second click on the label really
   * does reach the page. Base UI counts that as an outside press and dismisses
   * on `pointerdown`; the browser then forwards the `click` to the trigger,
   * which reopens what was just closed — the label could open the popover but
   * never close it, with a visible flicker in between. A `<label for>` points
   * at the trigger, so pressing it *is* pressing the trigger: cancel the
   * dismissal and let the forwarded click do the toggling.
   */
  const handleOpenChange = useCallback(
    (next: boolean, eventDetails?: { reason?: string, event?: Event, cancel: () => void }) => {
      if (disabled && next)
        return
      if (!next && eventDetails?.reason === 'outside-press' && labelTargetIdRef.current !== undefined) {
        const target = eventDetails.event?.target
        const label = target instanceof Element ? target.closest('label') : null
        if (label !== null && label.htmlFor === labelTargetIdRef.current) {
          eventDetails.cancel()
          return
        }
      }
      state.setOpen(next)
    },
    [disabled, state],
  )

  const clearSelection = useCallback(() => {
    if (deferredEnabled) {
      // Draft path: empty the draft and mark it changed so the close effect
      // commits the empty set.
      setDraftIds([])
      draftIdsRef.current = []
      draftItemsRef.current = []
      hasChangedRef.current = true
      return
    }
    if (props.selectionMode === 'multiple') {
      setSelectedValue([])
      props.onChange?.([], [])
    }
    else {
      setSelectedValue(undefined)
      props.onChange?.(undefined)
    }
  }, [deferredEnabled, props, setSelectedValue])

  const actions: InfiniteSelectActions<T> = {
    selectedItems,
    selectedIds,
    clear: clearSelection,
    close: () => state.setOpen(false),
  }

  // Base UI's Popover.Trigger contract, by position: first child triggers, the
  // rest are the overlay's. A function is the trigger whole — there is no
  // "rest" to split off, and the caller owns `state` anyway.
  const [triggerChild, panelSlots] = typeof children === 'function'
    ? [children, null]
    : (() => {
        const [first, ...rest] = Children.toArray(children)
        return [first, rest] as const
      })()

  const trigger = resolveRenderChildren(triggerChild, {
    ...state,
    selectedItems,
    selectedValue: effectiveSelectedValue,
    disabled,
  })

  // Two things are wired onto the caller's own element, because that element
  // is the control as far as the page is concerned:
  //
  // - `disabled`, or a disabled combobox looks live at its trigger. It is a
  //   plain HTML attribute, so it takes on our `Button` and on any native
  //   control; on anything else it is inert, which is why the guard at the top
  //   of `handleOpenChange` is what actually keeps the popover shut.
  // - `triggerId`, so a `FieldLabel htmlFor` has something to point at. An
  //   element that brought its own `id` keeps it — Base UI merges the render
  //   element's props last, so what is cloned in here outranks the id
  //   `Popover.Trigger` would otherwise generate.
  //
  // Nothing has to be wired for the click the label forwards: the trigger is a
  // real button, so the browser delivers that click to it and Base UI toggles.
  // The one exception is the second such click; see `handleOpenChange`.
  // The id a `FieldLabel htmlFor` can aim at: the element's own wins, `triggerId`
  // fills in. Needed twice — to clone in, and to recognise that label below.
  const triggerOwnId = isValidElement(trigger) ? (trigger.props as { id?: string }).id : undefined
  const labelTargetId = triggerOwnId ?? triggerId
  labelTargetIdRef.current = labelTargetId

  // Only the id is cloned in. `disabled` goes to `Popover.Trigger` instead, so
  // Base UI's own button machinery owns it: it suppresses activation, writes the
  // right attribute for the element it actually rendered, and — unlike a cloned
  // `disabled` — puts nothing on a trigger that is a plain `<div>`, where the
  // attribute would be inert but present.
  const wiredTrigger = isValidElement(trigger) && triggerId !== undefined && triggerOwnId === undefined
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, { id: triggerId })
    : trigger

  // Root gets data + selection wiring; presentation config goes to the parts.
  const shared = {
    'aria-label': props['aria-label'] ?? searchPlaceholder,
    ...list,
    getOption,
    'className': cn('rounded-none border-0 shadow-none', selectClassName),
    'inputValue': state.inputValue,
    'onInputChange': state.setInputValue,
    rowHeight,
    virtualized,
  }

  // The business-convenience layer: monolith props compose the panel parts.
  const panelChildren = (
    <>
      <InfiniteSelectSearch autoFocus placeholder={searchPlaceholder} />
      <InfiniteSelectList<T>
        loadMoreScrollOffset={loadMoreScrollOffset}
        maxListHeight={maxListHeight}
        renderItem={renderItem}
        scrollbars={scrollbars}
      />
      {panelSlots}
    </>
  )

  return (
    <Popover modal={lockScroll} open={state.open} onOpenChange={handleOpenChange}>
      {/* An element trigger IS the button (Base UI merges its props into the
          caller's element); anything else — a bare string, say — becomes the
          content of Base UI's own button instead. */}
      {isValidElement(wiredTrigger)
        ? <PopoverTrigger disabled={disabled} render={wiredTrigger} />
        : <PopoverTrigger disabled={disabled}>{wiredTrigger}</PopoverTrigger>}
      <PopoverContent
        {...popoverProps}
        className={cn(`
          gap-0 overflow-hidden p-0 inline-(--anchor-width) min-inline-72
        `, contentClassName)}
        data-slot="infinite-combobox-content"
      >
        <InfiniteSelectActionsProvider value={actions}>
          {props.selectionMode === 'multiple'
            ? (
                <InfiniteSelect<T>
                  {...shared}
                  selectionMode="multiple"
                  value={deferredEnabled ? draftIds : ((selectedValue as string[] | undefined) ?? [])}
                  onChange={(items, ids) => {
                    if (deferredEnabled) {
                      setDraftIds(ids)
                      draftItemsRef.current = items
                      draftIdsRef.current = ids
                      hasChangedRef.current = true
                      return
                    }
                    setSelectedValue(ids)
                    props.onChange?.(items, ids)
                  }}
                >
                  {panelChildren}
                </InfiniteSelect>
              )
            : (
                <InfiniteSelect<T>
                  {...shared}
                  value={selectedValue as string | undefined}
                  onChange={(item) => {
                    setSelectedValue(item === undefined ? undefined : getOption(item).id)
                    props.onChange?.(item)
                    if (closeOnSelect)
                      state.setOpen(false)
                  }}
                >
                  {panelChildren}
                </InfiniteSelect>
              )}
        </InfiniteSelectActionsProvider>
      </PopoverContent>
    </Popover>
  )
}
