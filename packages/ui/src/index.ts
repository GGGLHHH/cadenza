// Only src/components is public. src/primitives is vendored shadcn source — raw
// material, never exported directly. Promote a primitive by adding a file under
// src/components and exporting it here.
export * from './components/button'
export * from './components/data-pagination'
export * from './components/data-table'
export * from './components/field'
export * from './components/infinite-combobox'
export * from './components/infinite-select'
export * from './components/input-group'
export * from './components/loading-overlay'
export * from './components/scroll-area'
export * from './components/search-field'
export * from './components/spinner'
export * from './components/tabs'
export * from './lib/utils'
// React Aria vocabulary used in our public props (sorting, selection): re-export
// the types so business layers never need react-aria-components as a direct dep.
export type { Key, Selection, SortDescriptor } from 'react-aria-components'
