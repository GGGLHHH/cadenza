'use client'

import type { ReactElement, ReactNode } from 'react'
import type { ControllableSelectionProps, InfiniteSelectActions, InfiniteSelectAdapterProps, InfiniteSelectItemRenderParams, InfiniteSelectOption } from './infinite-select'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import { Popover, PopoverTrigger } from '@gedatou/cadenza-ui/primitives/popover'
import { useControllableState } from '@gedatou/cadenza-utils'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { InfiniteSelect, InfiniteSelectActionsProvider } from './infinite-select'

/**
 * Popover wrapper for `InfiniteSelect`: React Aria's `DialogTrigger` (via the
 * popover primitive) owns open state, focus restore and dismissal; this layer
 * adds the search/query split with debounce, and an optional commit-on-close
 * draft mode for multi selection.
 */

export interface InfiniteComboboxStateOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  searchValue?: string
  defaultSearchValue?: string
  onSearchValueChange?: (value: string) => void
  /** The debounced value meant for the actual request. */
  queryValue?: string
  defaultQueryValue?: string
  onQueryValueChange?: (value: string | undefined) => void
  debounceMs?: number
}

export interface InfiniteComboboxState<T = unknown> {
  open: boolean
  setOpen: (open: boolean) => void
  searchValue: string
  setSearchValue: (value: string) => void
  resetSearch: () => void
  queryValue: string | undefined
  selectedValue?: string | string[] | undefined
  selectedItems?: T[]
}

export function useInfiniteComboboxState({
  open,
  defaultOpen,
  onOpenChange,
  searchValue,
  defaultSearchValue,
  onSearchValueChange,
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
  const [inputValue, setInputValue] = useControllableState({
    value: searchValue,
    defaultValue: defaultSearchValue,
    onChange: onSearchValueChange,
    fallback: '',
  })
  const [queryState, setQueryState] = useControllableState<string | undefined>({
    value: queryValue,
    defaultValue: defaultQueryValue,
    ...(onQueryValueChange ? { onChange: onQueryValueChange } : {}),
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cancelQueryValue = useCallback(() => clearTimeout(timeoutRef.current), [])
  useEffect(() => cancelQueryValue, [cancelQueryValue])

  const setSearchValue = useCallback(
    (value: string) => {
      setInputValue(value)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(setQueryState, debounceMs, value === '' ? undefined : value)
    },
    [debounceMs, setInputValue, setQueryState],
  )

  const resetSearch = useCallback(() => {
    cancelQueryValue()
    setInputValue('')
    setQueryState(undefined)
  }, [cancelQueryValue, setInputValue, setQueryState])

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
    searchValue: inputValue,
    setOpen,
    setSearchValue,
  }
}

export type InfiniteComboboxChildren<T>
  = | ReactElement
    | ((params: InfiniteComboboxState<T>) => ReactElement)

interface InfiniteComboboxCommonProps<T> {
  /** Accessible name for the option list. Falls back to `searchPlaceholder`. */
  'aria-label'?: string
  /**
   * The trigger. Must be pressable in React Aria terms (our `Button`, or any
   * RAC pressable) — `DialogTrigger` wires it up. A function receives the
   * combobox state plus the current selection for summary rendering.
   */
  'children': InfiniteComboboxChildren<T>
  'state': InfiniteComboboxState
  'list': InfiniteSelectAdapterProps<T>
  'getOption': (item: T) => InfiniteSelectOption
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  'disabled'?: boolean
  'contentClassName'?: string
  /** Multi only: hold toggles as a draft and commit once, when the popover closes. */
  'commitOnClose'?: boolean
  'searchPlaceholder'?: string
  /** Rendered at the end of the list while the next page fetches. See InfiniteSelect. */
  'loadingMoreIndicator'?: ReactNode
  /**
   * The slot channel, passed through as `InfiniteSelect` children: state slots
   * plus footer. Footer buttons reach clear/close via `useInfiniteSelectActions`.
   */
  'slots'?: ReactNode
  'maxListHeight'?: number
  /** Single only: close the popover after picking. Defaults to true. */
  'closeOnSelect'?: boolean
  /**
   * Lock the page scroll while the popover is open. Off by default — the
   * popover is non-modal and the page scrolls freely. Turn on for the
   * RAC/Radix-style modal feel. When on, `closeOnScroll` is moot.
   */
  'lockScroll'?: boolean
  /**
   * Dismiss the popover when the page scrolls (React Aria's native non-modal
   * behavior, like a native select). Off by default: the popover stays open and
   * repositions with its anchor, matching Ant/Base UI. Ignored under
   * `lockScroll`, where the page cannot scroll at all.
   */
  'closeOnScroll'?: boolean
  'selectClassName'?: string
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
    renderItem,
    searchPlaceholder,
    loadingMoreIndicator,
    slots,
    state,
    closeOnSelect = true,
    lockScroll = false,
    closeOnScroll = false,
    selectClassName,
  } = props

  const isMultiple = props.multiple === true
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

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (disabled && next)
        return
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
    if (props.multiple) {
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

  const trigger
    = typeof children === 'function'
      ? children({
          ...state,
          selectedItems,
          selectedValue: effectiveSelectedValue,
        })
      : children

  const shared = {
    'aria-label': props['aria-label'],
    loadingMoreIndicator,
    ...list,
    getOption,
    maxListHeight,
    renderItem,
    searchPlaceholder,
    'className': cn('rounded-none border-0 shadow-none', selectClassName),
    'onSearchInputValueChange': state.setSearchValue,
    'searchInputValue': state.searchValue,
  }

  return (
    <PopoverTrigger isOpen={state.open} onOpenChange={handleOpenChange}>
      {trigger}
      <Popover
        isNonModal={!lockScroll}
        // RAC hard-wires non-modal popovers to dismiss on outside scroll, with
        // one exception: submenus (non-modal, no scroll listener, outside click
        // still dismisses). `trigger` is a public prop, and naming it
        // SubmenuTrigger opts into that branch — the only non-patch way to get
        // scroll-follows-anchor. Revisit if RAC ever ships shouldCloseOnScroll.
        trigger={!lockScroll && !closeOnScroll ? 'SubmenuTrigger' : undefined}
        className={cn(`
          gap-0 overflow-hidden p-0 inline-(--trigger-width) min-inline-72
        `, contentClassName)}
        data-slot="infinite-combobox-content"
      >
        <InfiniteSelectActionsProvider value={actions}>
          {props.multiple
            ? (
                <InfiniteSelect<T>
                  {...shared}
                  multiple
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
                  {slots}
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
                  {slots}
                </InfiniteSelect>
              )}
        </InfiniteSelectActionsProvider>
      </Popover>
    </PopoverTrigger>
  )
}
