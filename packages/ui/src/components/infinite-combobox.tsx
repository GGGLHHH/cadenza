'use client'

import type { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import type { ControllableSelectionProps, InfiniteSelectActions, InfiniteSelectAdapterProps, InfiniteSelectChangeEventDetails, InfiniteSelectChangeEventReason, InfiniteSelectItemRenderParams, InfiniteSelectOption } from './infinite-select'
import type { ScrollAreaScrollbars } from './scroll-area'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { useDebounceFn } from 'ahooks'
import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn } from '#lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '#primitives/popover'
import {
  InfiniteSelect,
  InfiniteSelectActionsProvider,
  InfiniteSelectInputGroup,
  InfiniteSelectList,
} from './infinite-select'

/**
 * Popover wrapper for `InfiniteSelect`: Base UI's `Popover` owns open state,
 * focus restore and dismissal; this layer adds the search/query split with
 * debounce, and an optional commit-on-close draft mode for multi selection.
 */

/**
 * Why the popover opened or closed: Base UI's Popover reasons pass through
 * whole, plus the panel-side reasons a close can carry (an `item-press` under
 * `closeOnSelect`, a footer `clear-press`/`close-press`) and `'none'` for
 * programmatic `setOpen`.
 */
export type InfiniteComboboxOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason | InfiniteSelectChangeEventReason

export type InfiniteComboboxOpenChangeEventDetails = ChangeEventDetails<InfiniteComboboxOpenChangeEventReason>

// `open`/`defaultOpen`/`onOpenChange` for the overlay and
// `inputValue`/`defaultInputValue`/`onInputValueChange` for the search text.
// `queryValue` — the debounced value meant for the request — is our own.
export interface InfiniteComboboxStateOptions {
  open?: boolean
  defaultOpen?: boolean
  /** `eventDetails.cancel()` keeps the popover where it is. */
  onOpenChange?: (open: boolean, eventDetails: InfiniteComboboxOpenChangeEventDetails) => void
  inputValue?: string
  defaultInputValue?: string
  /** `eventDetails.cancel()` rejects the text change (and the query it would arm). */
  onInputValueChange?: (value: string, eventDetails: InfiniteSelectChangeEventDetails) => void
  /** The debounced value meant for the actual request. */
  queryValue?: string
  defaultQueryValue?: string
  /** Gets its own details (same reason and event as the raw change); `cancel()` keeps the settled query. */
  onQueryValueChange?: (value: string | undefined, eventDetails: InfiniteSelectChangeEventDetails) => void
  debounceMs?: number
}

export interface InfiniteComboboxState<T = unknown> {
  open: boolean
  /** Details default to reason `'none'` (programmatic). */
  setOpen: (open: boolean, eventDetails?: InfiniteComboboxOpenChangeEventDetails) => void
  inputValue: string
  setInputValue: (value: string, eventDetails?: InfiniteSelectChangeEventDetails) => void
  resetSearch: () => void
  queryValue: string | undefined
  /** `null` is "cleared" in single mode; `undefined` only means the state hook never saw a selection. */
  selectedValue?: string | string[] | null | undefined
  selectedItems?: T[]
}

export function useInfiniteComboboxState({
  open,
  defaultOpen,
  onOpenChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  queryValue,
  defaultQueryValue,
  onQueryValueChange,
  debounceMs = 300,
}: InfiniteComboboxStateOptions = {}): InfiniteComboboxState {
  // No `onValueChange` wiring on the state hooks: the cancel protocol needs the
  // user callback to run before the state write, so they fire explicitly below.
  const [openState, setOpenState] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    fallback: false,
  })
  const [inputState, setInputState] = useControllableState({
    value: inputValue,
    defaultValue: defaultInputValue,
    fallback: '',
  })
  const [queryState, setQueryState] = useControllableState<string | undefined>({
    value: queryValue,
    defaultValue: defaultQueryValue,
  })

  const commitQuery = useCallback(
    (next: string | undefined, eventDetails: InfiniteSelectChangeEventDetails) => {
      onQueryValueChange?.(next, eventDetails)
      if (!eventDetails.isCanceled)
        setQueryState(next)
    },
    [onQueryValueChange, setQueryState],
  )
  // `debounceMs` is read at mount: ahooks builds the debounce once.
  const { run: commitQueryValue, cancel: cancelQueryValue } = useDebounceFn(
    commitQuery,
    { wait: debounceMs },
  )

  const setInputValue = useCallback(
    (value: string, eventDetails: InfiniteSelectChangeEventDetails = createChangeEventDetails('none')) => {
      onInputValueChange?.(value, eventDetails)
      if (eventDetails.isCanceled)
        return
      setInputState(value)
      // The query layer gets fresh details (same reason and event): its
      // cancel() must not read a flag the raw-text layer already consumed.
      commitQueryValue(
        value === '' ? undefined : value,
        createChangeEventDetails(eventDetails.reason, eventDetails.event),
      )
    },
    [commitQueryValue, onInputValueChange, setInputState],
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
    (nextOpen: boolean, eventDetails: InfiniteComboboxOpenChangeEventDetails = createChangeEventDetails('none')) => {
      onOpenChange?.(nextOpen, eventDetails)
      if (eventDetails.isCanceled)
        return
      if (nextOpen && shouldResetOnNextOpenRef.current) {
        resetSearch()
        shouldResetOnNextOpenRef.current = false
      }
      if (!nextOpen)
        shouldResetOnNextOpenRef.current = true
      setOpenState(nextOpen)
    },
    [onOpenChange, resetSearch, setOpenState],
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
  /**
   * Identifies the selection when a form is submitted: with a `name`, hidden
   * inputs render next to the trigger — outside the popover, which unmounts on
   * close — one per selected id (a single input in single mode). Under
   * `commitOnClose` only the committed selection serializes, never the draft.
   */
  'name'?: string
  'list': InfiniteSelectAdapterProps<T>
  'getOption': (item: T) => InfiniteSelectOption
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  'disabled'?: boolean
  /**
   * The popover's class outlet (`popoverProps` deliberately has no `className`).
   * Function form receives Base UI's popup state — the popover surface is a
   * Base UI slot, not a plain div.
   */
  'contentClassName'?: ComponentProps<typeof PopoverContent>['className']
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
   * Base UI's `modal`: lock the page scroll and trap outside interaction while
   * the popover is open. Off by default — the page scrolls freely and the
   * popover follows its anchor.
   */
  'modal'?: boolean
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
    modal = false,
    name,
    selectClassName,
    popoverProps,
    triggerId,
  } = props

  const isMultiple = props.selectionMode === 'multiple'
  const deferredEnabled = isMultiple && commitOnClose

  // `value !== undefined` judges controlled-ness, matching InfiniteSelect and
  // Base UI: `undefined` belongs to "uncontrolled", and a controlled single
  // select clears with `null`.
  const isValueControlled = props.value !== undefined
  const [internalValue, setInternalValue] = useState<string | string[] | null>(
    props.defaultValue ?? (isMultiple ? [] : null),
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
  const selectedIds = useMemo(() => isMultiple
    ? ((effectiveSelectedValue as string[] | null | undefined) ?? [])
    : typeof effectiveSelectedValue === 'string'
      ? [effectiveSelectedValue]
      : [], [effectiveSelectedValue, isMultiple])

  for (const item of list.items) {
    const id = getOption(item).id
    if (selectedIds.includes(id))
      selectedItemsCacheRef.current.set(id, item)
  }

  const selectedItems = useMemo(
    () => selectedIds
      .map(id => selectedItemsCacheRef.current.get(id))
      .filter((entry): entry is T => entry !== undefined),
    // `list.items` is deliberate, not exhaustive-deps noise: the cache above
    // fills during render, and a new page landing is exactly when a selected id
    // may become resolvable — nothing else re-runs this memo for it.
    // eslint-disable-next-line react/exhaustive-deps
    [selectedIds, list.items],
  )

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = state.open
    if (!deferredEnabled)
      return

    const justClosed = wasOpen === true && !state.open
    const justCommitted = justClosed && hasChangedRef.current
    if (justCommitted) {
      // draftIdsRef is authoritative (from InfiniteSelect); draftItemsRef only
      // echoes the loaded ones. The commit is programmatic from the callback's
      // point of view (the closing gesture is long gone), hence reason 'none';
      // cancel() rejects the commit and keeps the previous applied selection.
      const ids = draftIdsRef.current
      const eventDetails = createChangeEventDetails<InfiniteSelectChangeEventReason>('none')
      ;(props as { onValueChange?: (items: T[], ids: string[], eventDetails: InfiniteSelectChangeEventDetails) => void }).onValueChange?.(
        draftItemsRef.current,
        ids,
        eventDetails,
      )
      if (!eventDetails.isCanceled)
        setInternalValue(ids)
      hasChangedRef.current = false
    }

    // Don't reset to the external value right after committing: the parent
    // hasn't applied our onValueChange yet, so externalValueRef is stale — draftIds
    // already holds the committed ids.
    if (!justCommitted && (wasOpen === undefined || justClosed)) {
      const externalValue = externalValueRef.current
      if (externalValue !== undefined) {
        setDraftIds(externalValue)
        if (!justClosed)
          hasChangedRef.current = false
      }
    }
  }, [deferredEnabled, props, setInternalValue, state.open])

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
    (next: boolean, eventDetails: PopoverPrimitive.Root.ChangeEventDetails) => {
      if (disabled && next)
        return
      if (!next && eventDetails.reason === 'outside-press' && labelTargetIdRef.current !== undefined) {
        const target = eventDetails.event?.target
        const label = target instanceof Element ? target.closest('label') : null
        if (label !== null && label.htmlFor === labelTargetIdRef.current) {
          eventDetails.cancel()
          return
        }
      }
      // The same details object rides through: the caller's onOpenChange can
      // cancel(), and Base UI reads the flag after this handler returns.
      state.setOpen(next, eventDetails)
    },
    [disabled, state],
  )

  const clearSelection = useCallback((
    eventDetails: InfiniteSelectChangeEventDetails = createChangeEventDetails('none'),
  ) => {
    if (deferredEnabled) {
      // Draft path: empty the draft and mark it changed so the close effect
      // commits the empty set. No user callback fires until the commit, so
      // there is nothing here for cancel() to reject.
      setDraftIds([])
      draftIdsRef.current = []
      draftItemsRef.current = []
      hasChangedRef.current = true
      return
    }
    if (props.selectionMode === 'multiple') {
      props.onValueChange?.([], [], eventDetails)
      if (eventDetails.isCanceled)
        return
      setInternalValue([])
    }
    else {
      props.onValueChange?.(null, eventDetails)
      if (eventDetails.isCanceled)
        return
      setInternalValue(null)
    }
  }, [deferredEnabled, props, setInternalValue])

  // Provider value memoised (the house rule) with stable callbacks, so the
  // footer parts do not re-render with every keystroke in the search field.
  const close = useCallback(
    (eventDetails?: InfiniteSelectChangeEventDetails) => state.setOpen(false, eventDetails),
    [state],
  )
  const actions = useMemo<InfiniteSelectActions<T>>(() => ({
    selectedItems,
    selectedIds,
    clear: clearSelection,
    close,
  }), [clearSelection, close, selectedItems, selectedIds])

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
  // `setInputValue` receives Base UI's own details through InfiniteSelect and
  // runs the full protocol on them (caller callback, cancel, query debounce).
  const shared = {
    'aria-label': props['aria-label'] ?? searchPlaceholder,
    ...list,
    getOption,
    'className': cn('rounded-none border-0 shadow-none', selectClassName),
    'inputValue': state.inputValue,
    'onInputValueChange': state.setInputValue,
    rowHeight,
    virtualized,
  }

  // The business-convenience layer: monolith props compose the panel parts.
  const panelChildren = (
    <>
      <InfiniteSelectInputGroup autoFocus placeholder={searchPlaceholder} />
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
    <Popover modal={modal} open={state.open} onOpenChange={handleOpenChange}>
      {/* An element trigger IS the button (Base UI merges its props into the
          caller's element); anything else — a bare string, say — becomes the
          content of Base UI's own button instead. */}
      {isValidElement(wiredTrigger)
        ? <PopoverTrigger disabled={disabled} render={wiredTrigger} />
        : <PopoverTrigger disabled={disabled}>{wiredTrigger}</PopoverTrigger>}
      {name !== undefined && (isMultiple
        ? ((selectedValue as string[] | null | undefined) ?? []).map(id => (
            <input key={id} name={name} type="hidden" value={id} />
          ))
        : (
            <input
              name={name}
              type="hidden"
              value={typeof selectedValue === 'string' ? selectedValue : ''}
            />
          ))}
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
                  value={deferredEnabled ? draftIds : ((selectedValue as string[] | null | undefined) ?? [])}
                  onValueChange={(items, ids, eventDetails) => {
                    if (deferredEnabled) {
                      // Draft path: no user callback until the popover closes,
                      // so nothing here for cancel() to reject.
                      setDraftIds(ids)
                      draftItemsRef.current = items
                      draftIdsRef.current = ids
                      hasChangedRef.current = true
                      return
                    }
                    props.onValueChange?.(items, ids, eventDetails)
                    if (eventDetails.isCanceled)
                      return
                    setInternalValue(ids)
                  }}
                >
                  {panelChildren}
                </InfiniteSelect>
              )
            : (
                <InfiniteSelect<T>
                  {...shared}
                  value={(selectedValue as string | null | undefined) ?? null}
                  onValueChange={(item, eventDetails) => {
                    props.onValueChange?.(item, eventDetails)
                    if (eventDetails.isCanceled)
                      return
                    setInternalValue(item === null ? null : getOption(item).id)
                    if (closeOnSelect)
                      state.setOpen(false, eventDetails)
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
