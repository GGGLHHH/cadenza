import type { ReactElement } from 'react'
import {
  BellIcon,
  CheckIcon,
  GlobeIcon,
  HouseIcon,
  KeyIcon,
  LinkIcon,
  LockIcon,
  MenuIcon,
  MessageCircleIcon,
  PaintbrushIcon,
  SettingsIcon,
  VideoIcon,
} from '@gedatou/cadenza-icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const data = {
  nav: [
    { name: 'Notifications', icon: <BellIcon animateOnHover /> },
    { name: 'Navigation', icon: <MenuIcon animateOnHover /> },
    { name: 'Home', icon: <HouseIcon animateOnHover /> },
    { name: 'Appearance', icon: <PaintbrushIcon animateOnHover /> },
    { name: 'Messages & media', icon: <MessageCircleIcon animateOnHover /> },
    { name: 'Language & region', icon: <GlobeIcon animateOnHover /> },
    { name: 'Accessibility', icon: <KeyIcon animateOnHover /> },
    { name: 'Mark as read', icon: <CheckIcon animateOnHover /> },
    { name: 'Audio & video', icon: <VideoIcon animateOnHover /> },
    { name: 'Connected accounts', icon: <LinkIcon animateOnHover /> },
    { name: 'Privacy & visibility', icon: <LockIcon animateOnHover /> },
    { name: 'Advanced', icon: <SettingsIcon animateOnHover /> },
  ],
}

export function SettingsDialog(): ReactElement {
  // Upstream opens on mount (its preview is an iframe); here the block sits
  // on a docs page, where a modal opening by itself would take the page over.
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Open Dialog</DialogTrigger>
      <DialogPopup className="
        overflow-hidden p-0
        md:max-block-125 md:max-inline-175
        lg:max-inline-200
      "
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar
            collapsible="none"
            className="
              hidden
              md:flex
            "
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map(item => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === 'Messages & media'}
                          render={<a href="#" />}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex flex-1 flex-col overflow-hidden block-120">
            <header className="
              flex shrink-0 items-center gap-2 transition-[width,height]
              ease-linear block-16
              group-has-data-[collapsible=icon]/sidebar-wrapper:block-12
            "
            >
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="
                      hidden
                      md:block
                    "
                    >
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="
                      hidden
                      md:block
                    "
                    />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Messages & media</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="
              flex flex-1 flex-col gap-4 overflow-y-auto p-4 pbs-0
            "
            >
              {Array.from({
                length: 10,
              }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl bg-muted/50 max-inline-3xl"
                />
              ))}
            </div>
          </main>
        </SidebarProvider>
      </DialogPopup>
    </Dialog>
  )
}
