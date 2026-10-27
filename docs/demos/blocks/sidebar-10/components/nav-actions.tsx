import type { ReactElement } from 'react'
import {
  Button,
  Popover,
  PopoverPopup,
  PopoverTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@gedatou/cadenza-ui'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  ChartLineIcon,
  CopyIcon,
  EllipsisIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  LinkIcon,
  Redo2Icon,
  SlidersHorizontalIcon,
  StarIcon,
  Trash2Icon,
  TrashIcon,
  Undo2Icon,
} from '@gedatou/cadenza-ui/icons'

const data = [
  [
    {
      label: 'Customize Page',
      icon: <SlidersHorizontalIcon animateOnHover />,
    },
    {
      label: 'Turn into wiki',
      icon: <FileTextIcon animateOnHover />,
    },
  ],
  [
    {
      label: 'Copy Link',
      icon: <LinkIcon animateOnHover />,
    },
    {
      label: 'Duplicate',
      icon: <CopyIcon animateOnHover />,
    },
    {
      label: 'Move to',
      icon: <Redo2Icon animateOnHover />,
    },
    {
      label: 'Move to Trash',
      icon: <Trash2Icon animateOnHover />,
    },
  ],
  [
    {
      label: 'Undo',
      icon: <Undo2Icon animateOnHover />,
    },
    {
      label: 'View analytics',
      icon: <ChartLineIcon animateOnHover />,
    },
    {
      label: 'Version History',
      icon: <GalleryVerticalEndIcon animateOnHover />,
    },
    {
      label: 'Show delete pages',
      icon: <TrashIcon animateOnHover />,
    },
    {
      label: 'Notifications',
      icon: <BellIcon animateOnHover />,
    },
  ],
  [
    {
      label: 'Import',
      icon: <ArrowUpIcon animateOnHover />,
    },
    {
      label: 'Export',
      icon: <ArrowDownIcon animateOnHover />,
    },
  ],
]

// Upstream opens the popover on mount (an effect sets `open`); on a docs page
// full of demos that would pull focus to this block, so it starts closed.
export function NavActions(): ReactElement {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="
        hidden font-medium text-muted-foreground
        md:inline-block
      "
      >
        Edit Oct 08
      </div>
      <Button variant="ghost" size="icon" className="block-7 inline-7">
        <StarIcon />
      </Button>
      <Popover>
        <PopoverTrigger
          render={(
            <Button
              variant="ghost"
              size="icon"
              className="
                block-7 inline-7
                data-popup-open:bg-accent
              "
            />
          )}
        >
          <EllipsisIcon />
        </PopoverTrigger>
        <PopoverPopup
          className="overflow-hidden rounded-lg p-0 inline-56"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup
                  // eslint-disable-next-line react/no-array-index-key -- static groups, never reordered
                  key={index}
                  className="
                    border-be
                    last:border-none
                  "
                >
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map(item => (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton>
                            {item.icon}
                            {' '}
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverPopup>
      </Popover>
    </div>
  )
}
