'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useDebounceFn } from 'ahooks'
import { createContext, use, useCallback } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn, dataAttr } from '#lib/utils'
// The seam versions, not the primitives: their prop types carry the full Base UI
// contract (function className on the control, ref), so ours inherit it.
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group'

/**
 * The published SearchField family.
 *
 * A *field*, not an input: the root owns the text, the debounced query, the
 * clear gesture and Escape-to-clear, and hands them to its parts through
 * context — so the parts compose freely, in any order, with nothing threaded
 * down. Base UI has no search field, so this behaviour is the seam's own; the
 * visible parts are shadcn's `InputGroup` pieces, used under their own names
 * since a renamed passthrough would only hide where they came from.
 *
 * On top of the field we add one thing: the debounced, normalised query. Typing
 * updates `value` on every keystroke, while `queryValue` settles `debounceMs`
 * later with the text trimmed and an empty string turned into `undefined` —
 * ready to drop straight into a request or a URL. The vocabulary is
 * deliberately the same as `InfiniteCombobox`'s, which splits the same way.
 *
 * The root is a plain `<div>`, so its `className` is honestly a string. Style
 * off state through the data attributes it writes — `data-empty`,
 * `data-disabled`, `data-readonly` — the same channel the default composition
 * uses to hide the clear button.
 */

/** Why the text changed. Clearing is a reason, not a separate callback. */
export type SearchFieldChangeEventReason
  = 'input-change' | 'clear-press' | 'escape-key' | 'imperative-action' | 'none'

export type SearchFieldChangeEventDetails = ChangeEventDetails<SearchFieldChangeEventReason>

export interface SearchQueryOptions {
  /** Controlled raw text. */
  value?: string
  /** Uncontrolled initial text. */
  defaultValue?: string
  /**
   * Fires on every raw-text change with why it happened (`reason:
   * 'clear-press'`/`'escape-key'` replaces the old `onClear` callback).
   * `eventDetails.cancel()` rejects the change entirely.
   */
  onValueChange?: (value: string, eventDetails: SearchFieldChangeEventDetails) => void
  /** Controlled debounced query. */
  queryValue?: string
  /** Uncontrolled initial debounced query. */
  defaultQueryValue?: string
  /**
   * Fires once the typing settles, trimmed, empty string normalised away.
   * Gets its own `eventDetails` (same reason and event as the raw change);
   * `cancel()` keeps the settled query from updating.
   */
  onQueryValueChange?: (value: string | undefined, eventDetails: SearchFieldChangeEventDetails) => void
  /** Debounce interval in ms. */
  debounceMs?: number
}

export interface SearchQueryState {
  /** The raw text, in sync with the input. */
  value: string
  /** Sets the raw text and (re)arms the debounce. Details default to reason `'none'`. */
  setValue: (value: string, eventDetails?: SearchFieldChangeEventDetails) => void
  /** The settled query: trimmed, `undefined` when blank. */
  queryValue: string | undefined
  /** Clears both at once, cancelling any pending debounce. Details default to reason `'imperative-action'`. */
  resetSearch: (eventDetails?: SearchFieldChangeEventDetails) => void
}

/**
 * The debounced-search state, split out so a caller can own it — driving a
 * table's filter, say — without rendering our field at all. `SearchField` uses
 * it internally; passing the same props to the component is the shorthand.
 */
export function useSearchQuery({
  value,
  defaultValue,
  onValueChange,
  queryValue,
  defaultQueryValue,
  onQueryValueChange,
  debounceMs = 300,
}: SearchQueryOptions = {}): SearchQueryState {
  // No `onChange` wiring here: the cancel protocol needs the user callback to
  // run before the state write, so both hooks below only hold state and the
  // callbacks fire explicitly in setValue/resetSearch.
  const [text, setText] = useControllableState({ value, defaultValue, fallback: '' })
  const [query, setQuery] = useControllableState<string | undefined>({
    value: queryValue,
    defaultValue: defaultQueryValue,
  })

  const commitQuery = useCallback(
    (next: string | undefined, eventDetails: SearchFieldChangeEventDetails) => {
      onQueryValueChange?.(next, eventDetails)
      if (!eventDetails.isCanceled)
        setQuery(next)
    },
    [onQueryValueChange, setQuery],
  )
  // ahooks builds its debounce once, so `debounceMs` is read at mount and a
  // later change does not take effect — the same contract as `defaultValue`.
  const { run: commit, cancel } = useDebounceFn(commitQuery, { wait: debounceMs })

  const setValue = useCallback(
    (next: string, eventDetails: SearchFieldChangeEventDetails = createChangeEventDetails('none')) => {
      onValueChange?.(next, eventDetails)
      if (eventDetails.isCanceled)
        return
      setText(next)
      const normalized = next.trim()
      // The query layer gets fresh details (same reason and event): its
      // cancel() must not read a flag the raw-text layer already consumed.
      commit(
        normalized === '' ? undefined : normalized,
        createChangeEventDetails(eventDetails.reason, eventDetails.event),
      )
    },
    [commit, onValueChange, setText],
  )

  const resetSearch = useCallback(
    (eventDetails: SearchFieldChangeEventDetails = createChangeEventDetails('imperative-action')) => {
      onValueChange?.('', eventDetails)
      if (eventDetails.isCanceled)
        return
      // Clearing is an explicit act, so it skips the debounce entirely —
      // waiting 300ms to drop a filter reads as lag, not as smoothing.
      cancel()
      setText('')
      const queryDetails = createChangeEventDetails(eventDetails.reason, eventDetails.event)
      onQueryValueChange?.(undefined, queryDetails)
      if (!queryDetails.isCanceled)
        setQuery(undefined)
    },
    [cancel, onValueChange, onQueryValueChange, setQuery, setText],
  )

  return { value: text, setValue, queryValue: query, resetSearch }
}

/** What the field's parts read, and what function children are handed. */
export interface SearchFieldState {
  /** No text in the field. */
  empty: boolean
  disabled: boolean
  readOnly: boolean
}

interface SearchFieldContextValue extends SearchFieldState {
  'value': string
  'setValue': (value: string, eventDetails?: SearchFieldChangeEventDetails) => void
  'clear': (eventDetails?: SearchFieldChangeEventDetails) => void
  'submit': () => void
  'aria-label'?: string
}

const SearchFieldContext = createContext<SearchFieldContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  SearchFieldContext.displayName = 'SearchFieldContext'

function useSearchFieldContext(): SearchFieldContextValue {
  const context = use(SearchFieldContext)
  if (context === null)
    throw new Error('cadenza-ui: SearchFieldContext is missing. SearchField parts must be placed within <SearchField>.')
  return context
}

export type SearchFieldProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & SearchQueryOptions
    & {
      disabled?: boolean
      readOnly?: boolean
      /** Placeholder for the default composition's input. */
      placeholder?: string
      /** Fires on Enter, with the current raw text. */
      onSubmit?: (value: string) => void
      /**
       * Replaces the default composition (icon, input, clear button). Compose
       * the parts yourself to add a shortcut hint, a filter button, a second
       * addon — see the docs' composition example. A function receives the
       * field's state plus the default composition as `defaultChildren` —
       * nothing is injected, but extending beats rebuilding:
       * `{({ defaultChildren }) => …}`.
       */
      children?: ReactNode | ((state: SearchFieldState & { defaultChildren: ReactNode }) => ReactNode)
    }

/**
 * The text input. It reads the field's text, its handlers and its accessible
 * name from context, so it works anywhere inside the field; all it adds of its
 * own is hiding the browser's search-clear affordance, which would otherwise
 * sit next to ours.
 *
 * Deliberately carries no `data-slot` of its own. `InputGroupInput` sets
 * `data-slot="input-group-control"`, and that value is a contract, not a label:
 * `InputGroup` draws the focus ring off
 * `has-[[data-slot=input-group-control]:focus-visible]`. Since the primitive
 * spreads props after the attribute, passing one here silently replaces it and
 * the group stops ringing on focus.
 */
export function SearchFieldInput({
  className,
  onKeyDown,
  ...props
}: ComponentProps<typeof InputGroupInput>): ReactElement {
  const field = useSearchFieldContext()
  return (
    <InputGroupInput
      aria-label={field['aria-label']}
      className={cn('[&::-webkit-search-cancel-button]:appearance-none', className)}
      disabled={field.disabled}
      readOnly={field.readOnly}
      type="search"
      value={field.value}
      onChange={event => field.setValue(
        event.target.value,
        createChangeEventDetails('input-change', event.nativeEvent),
      )}
      {...props}
      // Chained, not left to the spread: a caller listening for keys must not
      // silently take Escape-to-clear away.
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented)
          return
        if (event.key === 'Escape')
          field.clear(createChangeEventDetails('escape-key', event.nativeEvent))
        if (event.key === 'Enter')
          field.submit()
      }}
    />
  )
}

/**
 * The clear button. It clears the field on click and hides itself while the
 * field is empty, off the root's `data-empty`.
 *
 * Leave it out when the field is read only — the default composition does. Not
 * for tidiness: a read-only field's clear button is disabled, and `InputGroup`
 * dims itself for *any* disabled descendant (`has-disabled:opacity-50`), so a
 * read-only field would render as a disabled one. `hidden` does not help —
 * a display:none element still answers `:has(:disabled)`.
 */
export function SearchFieldClear({
  className,
  children,
  onClick,
  ...props
}: ComponentProps<typeof InputGroupButton>): ReactElement {
  const field = useSearchFieldContext()
  return (
    <InputGroupAddon
      align="inline-end"
      className="group-data-empty/search-field:hidden"
      data-slot="search-field-clear-addon"
    >
      <InputGroupButton
        // English aria-only fallback, the house pattern ('Search', 'Loading'):
        // it never renders visibly, and a caller-passed aria-label wins.
        aria-label="Clear search"
        className={cn('rounded-full', className)}
        data-slot="search-field-clear"
        disabled={field.disabled}
        // Out of the tab order on purpose: keyboard users clear with Escape,
        // and a stop between the input and the next control is friction.
        tabIndex={-1}
        {...props}
        // After the spread for the same reason as the input's onKeyDown.
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented)
            field.clear(createChangeEventDetails('clear-press', event.nativeEvent))
        }}
      >
        {children ?? <IconX aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

export function SearchField({
  'aria-label': ariaLabel,
  children,
  className,
  debounceMs,
  defaultQueryValue,
  defaultValue,
  disabled = false,
  onQueryValueChange,
  onSubmit,
  onValueChange,
  placeholder,
  queryValue,
  readOnly = false,
  value,
  ...props
}: SearchFieldProps): ReactElement {
  const search = useSearchQuery({
    value,
    defaultValue,
    onValueChange,
    queryValue,
    defaultQueryValue,
    onQueryValueChange,
    debounceMs,
  })

  const state: SearchFieldState = { empty: search.value === '', disabled, readOnly }
  // Not memoised: `value` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: SearchFieldContextValue = {
    ...state,
    'value': search.value,
    'setValue': search.setValue,
    'clear': search.resetSearch,
    'submit': () => onSubmit?.(search.value),
    'aria-label': ariaLabel,
  }

  const defaultChildren = (
    <InputGroup>
      <InputGroupAddon>
        <IconSearch aria-hidden />
      </InputGroupAddon>
      <SearchFieldInput placeholder={placeholder} />
      {!readOnly && <SearchFieldClear />}
    </InputGroup>
  )

  return (
    <SearchFieldContext value={context}>
      <div
        className={cn('group/search-field inline-full', className)}
        data-disabled={dataAttr(disabled)}
        data-empty={dataAttr(state.empty)}
        data-readonly={dataAttr(readOnly)}
        data-slot="search-field"
        {...props}
      >
        {resolveRenderChildren(children, state, defaultChildren)}
      </div>
    </SearchFieldContext>
  )
}
