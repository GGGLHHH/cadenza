import type { ReactElement } from 'react'
import { PanelLeftIcon } from '@gedatou/cadenza-icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Separator,
  useSidebar,
} from '@gedatou/cadenza-ui'
import { SearchForm } from './search-form'

export function SiteHeader(): ReactElement {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="
      sticky inset-bs-0 z-50 flex items-center border-be bg-background
      inline-full
    "
    >
      <div className="
        flex items-center gap-2 px-4 block-(--header-height) inline-full
      "
      >
        <Button
          className="block-8 inline-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="
            me-2
            data-vertical:self-auto data-vertical:block-4
          "
        />
        <Breadcrumb className="
          hidden
          sm:block
        "
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="
          inline-full
          sm:ms-auto sm:inline-auto
        "
        />
      </div>
    </header>
  )
}
