import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// One-liner: with no children it renders the full default composition --
// the Select-style trigger, path echo, clear ✕, popup, and per-level
// submenus all come from items. Hover or arrow keys expand the next
// level; only leaves are selectable, and picking one commits the whole
// path and closes. "Australia" shows node-level disabling.
const REGIONS: CascaderNode[] = [
  {
    value: 'united-states',
    label: 'United States',
    items: [
      {
        value: 'california',
        label: 'California',
        items: [
          { value: 'san-francisco', label: 'San Francisco' },
          { value: 'los-angeles', label: 'Los Angeles' },
        ],
      },
      { value: 'washington', label: 'Washington', items: [{ value: 'seattle', label: 'Seattle' }] },
    ],
  },
  {
    value: 'canada',
    label: 'Canada',
    items: [{ value: 'ontario', label: 'Ontario', items: [{ value: 'toronto', label: 'Toronto' }] }],
  },
  { value: 'australia', label: 'Australia', disabled: true },
]

export default function BasicDemo(): ReactElement {
  return <Cascader aria-label="Region" items={REGIONS} placeholder="Select a region" />
}
