import type { ComponentType, ReactElement } from 'react'
import * as icons from '@gedatou/cadenza-icons'
import { SearchField } from '@gedatou/cadenza-ui'
import { useDeferredValue, useState } from 'react'

// Every icon the subpath exports, under the name you import it by; the trigger
// is not an icon.
const ALL = (Object.entries(icons) as [string, ComponentType<{ size?: number }>][])
  .filter(([name]) => name.endsWith('Icon') && name !== 'AnimateIcon')

// The whole set, searchable; each tile is the hover target, so pointing
// anywhere on it plays that icon's animation.
export default function GalleryDemo(): ReactElement {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim().toLowerCase())
  const shown = ALL.filter(([name]) => name.toLowerCase().includes(deferred))
  return (
    <div className="flex flex-col gap-4 inline-full">
      <SearchField aria-label="Search icons" onValueChange={setQuery} placeholder={`Search ${ALL.length} icons…`} value={query} />
      <div className="
        grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] content-start
        gap-2 overflow-y-auto max-block-112
      "
      >
        {shown.map(([name, Icon]) => (
          <icons.AnimateIcon key={name} animateOnHover>
            <div className="
              flex flex-col items-center gap-2 rounded-lg border px-2 py-3
              hover:bg-muted
            "
            >
              <Icon size={24} />
              <span className="
                truncate text-center text-xs text-muted-foreground inline-full
              "
              >
                {name}
              </span>
            </div>
          </icons.AnimateIcon>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {shown.length}
        {' '}
        /
        {' '}
        {ALL.length}
      </p>
    </div>
  )
}
