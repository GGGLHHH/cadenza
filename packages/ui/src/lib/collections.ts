/**
 * The vocabulary our collection components speak in public: which row, which
 * rows, sorted by what.
 *
 * These were re-exported straight from `react-aria-components` until the library
 * moved off that base. They are declared here, structurally identical to React
 * Aria's, so the public surface owns its own words rather than borrowing a
 * dependency's — and so a business layer never needs the base library as a
 * direct dependency to name a prop.
 */

/** Identifies one item in a collection. */
export type Key = string | number

/**
 * A set of selected keys, or every item at once.
 *
 * `'all'` exists because a list can be selected in full without the component
 * knowing every key — an infinite list has not loaded them, and a virtualized
 * one never holds them all. Enumerating is not an option there, so the state has
 * to be able to say "all" as a word.
 */
export type Selection = 'all' | Set<Key>

/** Which way a sorted column runs. */
export type SortDirection = 'ascending' | 'descending'

/** The current sorted column and direction. */
export interface SortDescriptor {
  /** The key of the column to sort by. */
  column: Key
  /** The direction to sort by. */
  direction: SortDirection
}
