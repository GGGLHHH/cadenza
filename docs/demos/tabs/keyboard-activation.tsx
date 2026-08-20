import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// Two modes to compare; focus a tab and try the arrow keys:
//   Default (manual) -- arrows only move focus; Enter/Space switches the
//     panel. When panels are expensive to load (requests, big charts) a
//     keyboard pass-through never triggers them by accident. The indicator
//     follows focus -- exactly the scenario where its "the one about to be
//     selected" semantics earn their keep
//   activateOnFocus -- the panel switches wherever focus lands
export default function KeyboardActivationDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="overview">
        <TabsList aria-label="Manual activation (default)">
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="analytics">Analytics</TabsTab>
          <TabsTab value="reports">Reports</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">
            Arrow keys move focus to the neighbouring tab, but the panel stays put.
          </p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">
            The analytics panel fetches tracking data once; it loads only after Enter / Space confirms.
          </p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">
            Same for the reports panel: no wasted request when the keyboard merely passes by.
          </p>
        </TabsPanel>
      </Tabs>

      <Tabs defaultValue="overview">
        <TabsList activateOnFocus aria-label="Activate on focus">
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="analytics">Analytics</TabsTab>
          <TabsTab value="reports">Reports</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">In this group the panel switches wherever focus goes.</p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">Smoother when panel content is cheap.</p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">One less Enter to press.</p>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
