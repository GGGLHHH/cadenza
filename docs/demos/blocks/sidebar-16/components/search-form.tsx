import type { ComponentProps, ReactElement } from 'react'
import { Label, SidebarInput } from '@gedatou/cadenza-ui'
import { SearchIcon } from '@gedatou/cadenza-ui/icons'
import { useId } from 'react'

export function SearchForm({ ...props }: ComponentProps<'form'>): ReactElement {
  // useId rather than upstream's id="search": several blocks share a page.
  const id = useId()
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor={id} className="sr-only">
          Search
        </Label>
        <SidebarInput
          id={id}
          placeholder="Type to search..."
          className="ps-7 block-8"
        />
        <SearchIcon className="
          pointer-events-none absolute inset-s-2 inset-bs-1/2 -translate-y-1/2
          opacity-50 select-none block-4 inline-4
        "
        />
      </div>
    </form>
  )
}
