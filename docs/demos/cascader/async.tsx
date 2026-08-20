import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// Stepwise async + infinite loading, one loader covers it all: the state
// and city levels lazy-load level by level (returning a bare array =
// that level loads in one go); the district level paginates -- returning
// { items, hasNextPage }, 20 per page over 3 pages, the sentinel at the
// bottom appends automatically, and once everything arrives a fading
// rule marks the end. While a panel's first page is in flight it carries
// data-loading, covered by the frosted LoadingOverlay (same as
// InfiniteSelect); results are cached for the component's lifetime, so
// closing and reopening does not refetch.
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function AsyncDemo(): ReactElement {
  return (
    // defaultValue demonstrates echoing: without opening the popup, the
    // component preloads page 0 along the selected path, and as soon as
    // labels land the raw values swap to State 2 / City 3 / District 3.
    <Cascader
      aria-label="Region"
      defaultValue={['r-1', 'r-1-2', 'r-1-2-3']}
      placeholder="Select a region (async)"
      loadItems={async (path, { page }) => {
        await sleep(500)
        if (path.length < 2) {
          const kind = path.length === 0 ? 'State' : 'City'
          return Array.from({ length: 6 }, (_, index): CascaderNode => ({
            value: `${path.at(-1) ?? 'r'}-${index}`,
            label: `${kind} ${index + 1}`,
          }))
        }
        return {
          items: Array.from({ length: 20 }, (_, index): CascaderNode => {
            const ordinal = page * 20 + index + 1
            return { value: `${path.at(-1)}-${ordinal}`, label: `District ${ordinal}`, leaf: true }
          }),
          hasNextPage: page < 2,
        }
      }}
    />
  )
}
