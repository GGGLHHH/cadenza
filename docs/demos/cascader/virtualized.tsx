import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// Virtualization: each panel renders through a fixed row-height virtual
// window (rowHeight, default 32), so tens of thousands of children never
// fill the DOM; on reopen it auto-scrolls to the selected item's spot.
// Keyboard ceiling: upstream Menu has no virtualization support, so
// typeahead and Home/End only see the mounted window; arrow keys walking
// row by row are unaffected.
const CATEGORIES: CascaderNode[] = [
  {
    value: 'common',
    label: 'Common categories',
    items: Array.from({ length: 8 }, (_, index) => ({
      value: `c${index}`,
      label: `Common ${index + 1}`,
    })),
  },
  {
    value: 'all',
    label: 'All items (10000)',
    items: Array.from({ length: 10000 }, (_, index) => ({
      value: `n${index}`,
      label: `Item ${index + 1}`,
    })),
  },
]

export default function VirtualizedDemo(): ReactElement {
  return <Cascader aria-label="Category" items={CATEGORIES} placeholder="Select an item" virtualized />
}
