import type { ComponentProps, ReactElement } from 'react'
import { SearchIcon } from '@gedatou/cadenza-icons'
import {
  Label,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from '@gedatou/cadenza-ui'
import { useId } from 'react'

export function SearchForm({ ...props }: ComponentProps<'form'>): ReactElement {
  const id = useId()
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor={id} className="sr-only">
            Search
          </Label>
          <SidebarInput
            id={id}
            placeholder="Search the docs..."
            className="ps-8"
          />
          <SearchIcon className="
            pointer-events-none absolute inset-s-2 inset-bs-1/2 -translate-y-1/2
            opacity-50 select-none block-4 inline-4
          "
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
