import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// Uncontrolled usage: defaultValue picks the initial tab; TabsTab and
// TabsPanel pair up automatically through the shared value.
// Arrow-key switching and the aria-controls / aria-labelledby wiring are
// all handled by Base UI -- nothing to write by hand.
// The sliding selection background (TabsIndicator) is present by default:
// it follows the pointer on hover and glides back to the selection after.
// Nothing to write; indicator={false} turns it off, and writing your own
// <TabsIndicator className=…> hands it over entirely
export default function BasicDemo(): ReactElement {
  return (
    <Tabs defaultValue="analytics">
      <TabsList aria-label="Project dashboard">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="analytics">Analytics</TabsTab>
        <TabsTab value="reports">Reports</TabsTab>
      </TabsList>
      <TabsPanel value="overview">
        <p className="text-sm text-muted-foreground">A summary view of overall progress, member assignments, and this week's to-dos.</p>
      </TabsPanel>
      <TabsPanel value="analytics">
        <p className="text-sm text-muted-foreground">Weekly aggregated traffic, retention, and conversion trends.</p>
      </TabsPanel>
      <TabsPanel value="reports">
        <p className="text-sm text-muted-foreground">Archived monthly reports, exportable as PDF or CSV.</p>
      </TabsPanel>
    </Tabs>
  )
}
