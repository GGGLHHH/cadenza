import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// With orientation="vertical" the TabsList stacks on the left and panels
// sit on the right; the arrow keys switch axes too (up/down moves between
// tabs), which Base UI handles automatically from orientation.
// The indicator switches axes as well: it slides vertically and tweens
// its height
export default function VerticalDemo(): ReactElement {
  return (
    <Tabs className="flex gap-4" defaultValue="overview" orientation="vertical">
      <TabsList aria-label="Project dashboard">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="analytics">Analytics</TabsTab>
        <TabsTab value="reports">Reports</TabsTab>
        <TabsTab value="settings">Settings</TabsTab>
      </TabsList>
      <TabsPanel className="flex-1 min-block-32" value="overview">
        <p className="text-sm text-muted-foreground">Overall progress, member activity, and this week's key metrics at a glance.</p>
      </TabsPanel>
      <TabsPanel className="flex-1 min-block-32" value="analytics">
        <p className="text-sm text-muted-foreground">Breakdowns of traffic sources, conversion funnels, and retention curves.</p>
      </TabsPanel>
      <TabsPanel className="flex-1 min-block-32" value="reports">
        <p className="text-sm text-muted-foreground">Weekly and monthly auto-generated reports, with export and subscription.</p>
      </TabsPanel>
      <TabsPanel className="flex-1 min-block-32" value="settings">
        <p className="text-sm text-muted-foreground">Settings for project name, collaboration permissions, and notification rules.</p>
      </TabsPanel>
    </Tabs>
  )
}
