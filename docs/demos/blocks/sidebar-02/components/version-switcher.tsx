import type { ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@gedatou/cadenza-ui'
import {
  CheckIcon,
  ChevronUpDownIcon,
  GalleryVerticalEndIcon,
} from '@gedatou/cadenza-ui/icons'
import { useState } from 'react'

export function VersionSwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[]
  defaultVersion: string
}): ReactElement {
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                size="lg"
                className="
                  data-popup-open:bg-sidebar-accent
                  data-popup-open:text-sidebar-accent-foreground
                "
              />
            )}
          >
            <div className="
              flex aspect-square items-center justify-center rounded-lg
              bg-sidebar-primary text-sidebar-primary-foreground block-8
              inline-8
            "
            >
              <GalleryVerticalEndIcon
                animateOnHover
                className="block-4 inline-4"
              />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">Documentation</span>
              <span className="">
                v
                {selectedVersion}
              </span>
            </div>
            <ChevronUpDownIcon className="ms-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuPopup align="start">
            {versions.map(version => (
              <DropdownMenuItem
                key={version}
                onClick={() => setSelectedVersion(version)}
              >
                v
                {version}
                {' '}
                {version === selectedVersion && <CheckIcon className="ms-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuPopup>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
