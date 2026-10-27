import type { ReactElement } from 'react'
import {
  ChartColumnIcon,
  FrameIcon,
  MapPinIcon,
  MessageCircleQuestionIcon,
  SendIcon,
} from '@gedatou/cadenza-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from '@gedatou/cadenza-ui'
import { Suspense, use, useState } from 'react'
import { SidebarFrame } from '../lib/sidebar-frame'

const projects = [
  {
    name: 'Design Engineering',
    url: '#',
    icon: FrameIcon,
    badge: '24',
  },
  {
    name: 'Sales & Marketing',
    url: '#',
    icon: ChartColumnIcon,
    badge: '12',
  },
  {
    name: 'Travel',
    url: '#',
    icon: MapPinIcon,
    badge: '3',
  },
  {
    name: 'Support',
    url: '#',
    icon: MessageCircleQuestionIcon,
    badge: '21',
  },
  {
    name: 'Feedback',
    url: '#',
    icon: SendIcon,
    badge: '8',
  },
]

// Dummy fetch function.
async function fetchProjects(): Promise<typeof projects> {
  return new Promise(resolve => setTimeout(resolve, 3000, projects))
}

// shadcn's sidebar-rsc example, made client-side: the menu suspends on a
// slow fetch, showing SidebarMenuSkeleton rows until the data lands. Upstream
// awaits in a server component; here `use()` reads a promise held in state.
export default function SidebarRscDemo(): ReactElement {
  // Created once per mount, outside the Suspense boundary, so retries read the same promise.
  const [projectsPromise] = useState(fetchProjects)

  return (
    <SidebarFrame>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <Suspense fallback={<NavProjectsSkeleton />}>
                  <NavProjects projectsPromise={projectsPromise} />
                </Suspense>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </SidebarFrame>
  )
}

function NavProjectsSkeleton(): ReactElement {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function NavProjects({ projectsPromise }: { projectsPromise: Promise<typeof projects> }): ReactElement {
  const projects = use(projectsPromise)

  return (
    <SidebarMenu>
      {projects.map(project => (
        <SidebarMenuItem key={project.name}>
          <SidebarMenuButton render={<a href={project.url} />}>
            <project.icon animateOnHover />
            <span>{project.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
