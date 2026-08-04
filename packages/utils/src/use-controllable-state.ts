import type { Dispatch, SetStateAction } from 'react'
import { useControllableValue } from 'ahooks'
import { useEffect, useRef } from 'react'

export interface ControllableStateOptions<T> {
  /** The controlled value. Non-undefined at first render means controlled for the component's lifetime. */
  value?: T
  /** Initial value for the uncontrolled case. */
  defaultValue?: T
  /** Fires on every change, controlled or not, with the next value. */
  onChange?: (value: T) => void
}

/**
 * `useControllableValue` reshaped to the `useState` contract, with Base UI's
 * controlled-ness semantics (`@base-ui/utils/useControlled`):
 *
 * - Returns `[state, setState]`; `setState` is a `Dispatch<SetStateAction<T>>` —
 *   it takes a value or an `(prev) => next` updater, and its identity is stable
 *   across renders, so it is safe in dependency arrays.
 * - Controlled-ness is decided at FIRST render by `value !== undefined` and
 *   never re-judged: `undefined` belongs to "uncontrolled" — a controlled
 *   empty value is `null`, not `undefined`. Switching direction mid-life
 *   warns in dev and is ignored at runtime (a locked-controlled component
 *   whose `value` later turns `undefined` renders `undefined`, it does not
 *   fall back to internal state).
 * - Changing `defaultValue` after mount while uncontrolled also warns — it
 *   never takes effect, matching React's native-input behaviour.
 * - `fallback` seeds the uncontrolled-without-`defaultValue` case so the return
 *   type narrows to `T` instead of `T | undefined`.
 *
 * Why wrap at all: the raw ahooks API is configured through a props object plus
 * stringly-typed propName options, and its setter takes extra varargs — nothing
 * like `useState`. This collapses it to the same shape, drop-in at call sites.
 */
export function useControllableState<T>(
  options: ControllableStateOptions<T> & { fallback: T },
): [T, Dispatch<SetStateAction<T>>]
export function useControllableState<T>(
  options: ControllableStateOptions<T>,
): [T | undefined, Dispatch<SetStateAction<T | undefined>>]
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  fallback,
}: ControllableStateOptions<T> & { fallback?: T }): [T, Dispatch<SetStateAction<T>>] {
  // Locked at first render, never re-judged (Base UI useControlled semantics).
  const isControlled = useRef(value !== undefined).current

  const initialDefaultRef = useRef(defaultValue)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (isControlled !== (value !== undefined)) {
        console.error(
          `cadenza-ui: a component is changing from ${isControlled ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'uncontrolled' : 'controlled'}. `
          + 'Controlled-ness is decided at first render by `value !== undefined` and cannot change; '
          + 'use `null` (not `undefined`) as the controlled empty value.',
        )
      }
      if (!isControlled && initialDefaultRef.current !== defaultValue) {
        console.error(
          'cadenza-ui: a component is changing the defaultValue of an uncontrolled state after mount. '
          + 'It never takes effect — switch to a controlled `value` instead.',
        )
      }
    }
  }, [isControlled, value, defaultValue])

  // ahooks decides controlled-ness by hasOwnProperty('value') per render; feed
  // it the locked verdict instead — a locked-controlled component keeps its
  // `value` key even when the prop momentarily turns undefined, and a
  // locked-uncontrolled one never gains it.
  const props: ControllableStateOptions<T> = {}
  if (isControlled)
    props.value = value
  if (defaultValue !== undefined)
    props.defaultValue = defaultValue
  if (onChange)
    props.onChange = onChange

  return useControllableValue<T>(props, fallback === undefined ? {} : { defaultValue: fallback })
}
