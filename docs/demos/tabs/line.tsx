import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// variant="line" changes looks only: the pill background is replaced by a
// 2px line along the bottom edge; the same indicator (present by default)
// just takes a different shape under the line variant, with identical
// sliding and hover-following behaviour.
export default function LineDemo(): ReactElement {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project dashboard" variant="line">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="analytics">Analytics</TabsTab>
        <TabsTab value="reports">Reports</TabsTab>
      </TabsList>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="overview">
        A summary view of current progress, member assignments, and upcoming milestones.
      </TabsPanel>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="analytics">
        Traffic, retention, and conversion trends, viewable by week or by month.
      </TabsPanel>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="reports">
        Archived weekly and monthly reports, exportable as PDF or CSV.
      </TabsPanel>
    </Tabs>
  )
}
