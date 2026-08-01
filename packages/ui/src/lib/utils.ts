import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * A render-props className. React Aria types it
 * `(values & { defaultClassName }) => string`, Base UI `(state) => string` —
 * `never` in parameter position accepts both (and any other state shape).
 */
type ClassFunction = (values: never) => string | undefined

type ClassInput = ClassValue | ClassFunction

type CnResult<Inputs extends readonly ClassInput[]>
  = Extract<Inputs[number], ClassFunction> extends never
    ? string
    : string | ((values: unknown) => string)

/**
 * Merge conditional class names, last-wins on conflicting Tailwind utilities.
 *
 * React Aria and Base UI accept `className` as a *function of state* — their
 * documented styling contract. clsx silently drops functions, so a plain
 * `cn(base, className)` in a wrapper would swallow a caller's function without
 * an error, while the props type keeps promising it works. Every wrapper in
 * this library funnels className through here, so this is the one place that
 * contract can be kept: given a function argument, `cn` returns a function
 * that resolves it against the state it is eventually called with, then merges
 * as usual. String callers see no change, and the wrapper's own classes still
 * lose to the caller's on conflict.
 */
export function cn<Inputs extends readonly ClassInput[]>(...inputs: Inputs): CnResult<Inputs>
export function cn(...inputs: ClassInput[]): string | ((values: unknown) => string) {
  const resolve = (values?: unknown): string => twMerge(clsx(inputs.map(
    // The parameter-side cast: ClassFunction takes `never` so it can accept any
    // caller-declared state shape; invoking it needs the loose view back.
    input => typeof input === 'function' ? (input as (values: unknown) => string | undefined)(values) : input,
  )))
  // Without a function there is nothing to defer — resolve now, return string.
  return inputs.some(input => typeof input === 'function') ? resolve : resolve()
}
