'use client'

import type { ComponentProps, ReactElement, ReactNode, RefAttributes } from 'react'
import type { SearchFieldProps as RACSearchFieldProps } from 'react-aria-components'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useDebounceFn } from 'ahooks'
import { useCallback } from 'react'
import { SearchField as SearchFieldPrimitive } from 'react-aria-components'
import { cn } from '#lib/utils'
// The seam versions, not the primitives: their prop types carry the full RAC
// contract (function className, hover events, ref), so ours inherit it.
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group'

/**
 * The published SearchField family.
 *
 * React Aria calls this a *field*, not an input, and the root here is its
 * `SearchField` — so Escape-to-clear, the clear button's wiring and
 * `type="search"` semantics all come from RAC rather than from us. The parts
 * are shadcn's `InputGroup` pieces — used under their own names, since a
 * renamed passthrough would only hide where they came from. They render RAC's
 * own `Input` and `Button`, which is what lets them pick up the field's
 * contexts by just being inside it, with no props threaded down.
 *
 * Only two parts are ours, and only because they add something: the input
 * resets the native search cancel button, and the clear button hides itself
 * while the field is empty.
 *
 * On top of RAC we add one thing: the debounced, normalised query. Typing
 * updates `value` on every keystroke, while `queryValue` settles `debounceMs`
 * later with the text trimmed and an empty string turned into `undefined` —
 * ready to drop straight into a request or a URL. The vocabulary is
 * deliberately the same as `InfiniteCombobox`'s, which splits the same way.
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

export type SearchFieldProps
  = Omit<RACSearchFieldProps, 'value' | 'defaultValue' | 'onChange' | 'children'>
    // RAC declares the ref on the component type, not in the props — restated
    // here so `<SearchField ref={…}>` typechecks; the spread already carries it.
    & RefAttributes<HTMLDivElement>
    & SearchQueryOptions
    & {
      /** Placeholder for the default composition's input. */
      placeholder?: string
      /**
       * Replaces the default composition (icon, input, clear button). Compose
       * the parts yourself to add a shortcut hint, a filter button, a second
       * addon — see the docs' composition example.
       */
      children?: ReactNode
    }

/**
 * The text input. RAC's SearchField wires it up by context alone; all this adds
 * is hiding the browser's own search-clear affordance, which would otherwise
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
  ...props
}: ComponentProps<typeof InputGroupInput>): ReactElement {
  return (
    <InputGroupInput
      className={cn('[&::-webkit-search-cancel-button]:appearance-none', className)}
      {...props}
    />
  )
}

/**
 * The clear button. RAC gives any `Button` inside a `SearchField` the clear
 * behaviour, so there is nothing to wire; it only hides itself while the field
 * is empty, off the root's `data-empty`.
 *
 * Leave it out when the field is read only — the default composition does. Not
 * for tidiness: React Aria disables the clear button there, and `InputGroup`
 * dims itself for *any* disabled descendant (`has-disabled:opacity-50`), so a
 * read-only field would render as a disabled one. `hidden` does not help —
 * a display:none element still answers `:has(:disabled)`.
 */
export function SearchFieldClearButton({
  className,
  children,
  ...props
}: ComponentProps<typeof InputGroupButton>): ReactElement {
  return (
    <InputGroupAddon
      align="inline-end"
      className="group-data-empty/search-field:hidden"
      data-slot="search-field-clear-addon"
    >
      <InputGroupButton
        aria-label="清除搜索"
        className={cn('rounded-full', className)}
        data-slot="search-field-clear"
        {...props}
      >
        {children ?? <IconX aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

export function SearchField({
  className,
  placeholder,
  children,
  value,
  defaultValue,
  onChange,
  queryValue,
  defaultQueryValue,
  onQueryValueChange,
  debounceMs,
  onClear,
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

  return (
    <SearchFieldPrimitive
      className={cn('group/search-field inline-full', className)}
      data-slot="search-field"
      value={search.value}
      onChange={search.setValue}
      // Destructured and chained, not left to the spread: a caller's onClear
      // would otherwise replace resetSearch wholesale, and clearing would wait
      // out the debounce instead of dropping the query immediately.
      onClear={() => {
        search.resetSearch()
        onClear?.()
      }}
      {...props}
    >
      {renderProps => children ?? (
        <InputGroup>
          <InputGroupAddon>
            <IconSearch aria-hidden />
          </InputGroupAddon>
          <SearchFieldInput placeholder={placeholder} />
          {!renderProps.isReadOnly && <SearchFieldClearButton />}
        </InputGroup>
      )}
    </SearchFieldPrimitive>
  )
}
