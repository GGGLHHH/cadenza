import type { Dispatch, SetStateAction } from 'react'
import { useControllableValue } from 'ahooks'

export interface ControllableStateOptions<T> {
  /** The controlled value. Present (non-undefined) means controlled: state mirrors it. */
  value?: T
  /** Initial value for the uncontrolled case. */
  defaultValue?: T
  /** Fires on every change, controlled or not, with the next value. */
  onChange?: (value: T) => void
}

/**
 * `useControllableValue` reshaped to the `useState` contract.
 *
 * - Returns `[state, setState]`; `setState` is a `Dispatch<SetStateAction<T>>` —
 *   it takes a value or an `(prev) => next` updater, and its identity is stable
 *   across renders, so it is safe in dependency arrays.
 * - A present `value` means controlled (state follows the prop, `setState` only
 *   fires `onChange`); otherwise the hook owns the state. This matches React's
 *   controlled/uncontrolled input convention.
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
  // Attach keys only when set: ahooks decides controlled-ness by
  // hasOwnProperty('value'), so stuffing undefined in would read as "controlled,
  // value undefined" and pin the state to undefined forever.
  const props: ControllableStateOptions<T> = {}
  if (value !== undefined)
    props.value = value
  if (defaultValue !== undefined)
    props.defaultValue = defaultValue
  if (onChange)
    props.onChange = onChange

  return useControllableValue<T>(props, fallback === undefined ? {} : { defaultValue: fallback })
}
