import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// Disabling is declared per tab; Base UI has no root-level disabled set --
// when the set is computed from data, just write disabled={ids.has(id)}
// inside the map. Disabled tabs are skipped by keyboard navigation, and the
// indicator never follows them either -- hovering one leaves it on the
// current selection.
export default function DisabledDemo(): ReactElement {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project dashboard">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab disabled value="analytics">Analytics</TabsTab>
        <TabsTab disabled value="reports">Reports</TabsTab>
        <TabsTab value="settings">Settings</TabsTab>
      </TabsList>
      <TabsPanel value="overview">
        <p className="text-sm text-muted-foreground">
          12 tasks added this week, 3 milestones completed on schedule.
        </p>
      </TabsPanel>
      <TabsPanel value="analytics">
        <p className="text-sm text-muted-foreground">Data collection is not wired up yet.</p>
      </TabsPanel>
      <TabsPanel value="reports">
        <p className="text-sm text-muted-foreground">This account has no permission to view reports.</p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p className="text-sm text-muted-foreground">
          Configure project members, notifications, and integrations here.
        </p>
      </TabsPanel>
    </Tabs>
  )
}
