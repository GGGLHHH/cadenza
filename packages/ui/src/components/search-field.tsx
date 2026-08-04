'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useDebounceFn } from 'ahooks'
import { createContext, use, useCallback } from 'react'
import { cn } from '#lib/utils'
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

export interface SearchQueryOptions {
  /** Controlled raw text. */
  value?: string
  /** Uncontrolled initial text. */
  defaultValue?: string
  /** Fires on every keystroke, with the raw text. */
  onChange?: (value: string) => void
  /** Controlled debounced query. */
  queryValue?: string
  /** Uncontrolled initial debounced query. */
  defaultQueryValue?: string
  /** Fires once the typing settles, trimmed, empty string normalised away. */
  onQueryValueChange?: (value: string | undefined) => void
  /** Debounce interval in ms. */
  debounceMs?: number
}

export interface SearchQueryState {
  /** The raw text, in sync with the input. */
  value: string
  /** Sets the raw text and (re)arms the debounce. */
  setValue: (value: string) => void
  /** The settled query: trimmed, `undefined` when blank. */
  queryValue: string | undefined
  /** Clears both at once, cancelling any pending debounce. */
  resetSearch: () => void
}

/**
 * The debounced-search state, split out so a caller can own it — driving a
 * table's filter, say — without rendering our field at all. `SearchField` uses
 * it internally; passing the same props to the component is the shorthand.
 */
export function useSearchQuery({
  value,
  defaultValue,
  onChange,
  queryValue,
  defaultQueryValue,
  onQueryValueChange,
  debounceMs = 300,
}: SearchQueryOptions = {}): SearchQueryState {
  const [text, setText] = useControllableState({
    value,
    defaultValue,
    onChange,
    fallback: '',
  })
  const [query, setQuery] = useControllableState<string | undefined>({
    value: queryValue,
    defaultValue: defaultQueryValue,
    ...(onQueryValueChange ? { onChange: onQueryValueChange } : {}),
  })

  // ahooks builds its debounce once, so `debounceMs` is read at mount and a
  // later change does not take effect — the same contract as `defaultValue`.
  const { run: commit, cancel } = useDebounceFn(setQuery, { wait: debounceMs })

  const setValue = useCallback(
    (next: string) => {
      setText(next)
      const normalized = next.trim()
      commit(normalized === '' ? undefined : normalized)
    },
    [commit, setText],
  )

  const resetSearch = useCallback(() => {
    // Clearing is an explicit act, so it skips the debounce entirely —
    // waiting 300ms to drop a filter reads as lag, not as smoothing.
    cancel()
    setText('')
    setQuery(undefined)
  }, [cancel, setQuery, setText])

  return { value: text, setValue, queryValue: query, resetSearch }
}

/** What the field's parts read, and what function children are handed. */
export interface SearchFieldRenderProps {
  /** No text in the field. */
  empty: boolean
  disabled: boolean
  readOnly: boolean
}

interface SearchFieldContextValue extends SearchFieldRenderProps {
  'value': string
  'setValue': (value: string) => void
  'clear': () => void
  'submit': () => void
  'aria-label'?: string
}

const SearchFieldContext = createContext<SearchFieldContextValue | null>(null)

export type SearchFieldProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & SearchQueryOptions
    & {
      disabled?: boolean
      readOnly?: boolean
      /** Placeholder for the default composition's input. */
      placeholder?: string
      /** Fires after the field has been cleared, by button or by Escape. */
      onClear?: () => void
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
      children?: ReactNode | ((state: SearchFieldRenderProps & { defaultChildren: ReactNode }) => ReactNode)
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
  const field = use(SearchFieldContext)
  return (
    <InputGroupInput
      aria-label={field?.['aria-label']}
      className={cn('[&::-webkit-search-cancel-button]:appearance-none', className)}
      disabled={field?.disabled}
      readOnly={field?.readOnly}
      type="search"
      value={field?.value}
      onChange={event => field?.setValue(event.target.value)}
      {...props}
      // Chained, not left to the spread: a caller listening for keys must not
      // silently take Escape-to-clear away.
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented)
          return
        if (event.key === 'Escape')
          field?.clear()
        if (event.key === 'Enter')
          field?.submit()
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
export function SearchFieldClearButton({
  className,
  children,
  onClick,
  ...props
}: ComponentProps<typeof InputGroupButton>): ReactElement {
  const field = use(SearchFieldContext)
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
        disabled={field?.disabled}
        // Out of the tab order on purpose: keyboard users clear with Escape,
        // and a stop between the input and the next control is friction.
        tabIndex={-1}
        {...props}
        // After the spread for the same reason as the input's onKeyDown.
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented)
            field?.clear()
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
  onChange,
  onClear,
  onQueryValueChange,
  onSubmit,
  placeholder,
  queryValue,
  readOnly = false,
  value,
  ...props
}: SearchFieldProps): ReactElement {
  const search = useSearchQuery({
    value,
    defaultValue,
    onChange,
    queryValue,
    defaultQueryValue,
    onQueryValueChange,
    debounceMs,
  })

  const { resetSearch, setValue } = search
  const clear = useCallback(() => {
    resetSearch()
    onClear?.()
  }, [onClear, resetSearch])

  const state: SearchFieldRenderProps = { empty: search.value === '', disabled, readOnly }
  // Not memoised: `value` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency.
  const context: SearchFieldContextValue = {
    ...state,
    'value': search.value,
    setValue,
    clear,
    'submit': () => onSubmit?.(search.value),
    'aria-label': ariaLabel,
  }

  const defaultChildren = (
    <InputGroup>
      <InputGroupAddon>
        <IconSearch aria-hidden />
      </InputGroupAddon>
      <SearchFieldInput placeholder={placeholder} />
      {!readOnly && <SearchFieldClearButton />}
    </InputGroup>
  )

  return (
    <SearchFieldContext value={context}>
      <div
        className={cn('group/search-field inline-full', className)}
        data-disabled={disabled || undefined}
        data-empty={state.empty || undefined}
        data-readonly={readOnly || undefined}
        data-slot="search-field"
        {...props}
      >
        {resolveRenderChildren(children, state, defaultChildren)}
      </div>
    </SearchFieldContext>
  )
}
