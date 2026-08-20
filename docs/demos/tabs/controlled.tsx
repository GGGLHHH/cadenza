import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

const TAB_VALUES = ['overview', 'analytics', 'reports']

// Controlled: the selection lives in an external useState and Tabs only
// renders -- the external "Next" button switches tabs by mutating state
// directly, proving value is the single source of truth; the indicator
// slides along with external state exactly as it does for label clicks
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('overview')

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Project dashboard">
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="analytics">Analytics</TabsTab>
          <TabsTab value="reports">Reports</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">Overall progress and this week's key metrics.</p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">Traffic trends, conversion funnels, and source breakdowns.</p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">Archive of generated weekly and monthly reports.</p>
        </TabsPanel>
      </Tabs>
      <div className="flex items-center gap-3">
        <DemoButton
          onClick={() => {
            const next = (TAB_VALUES.indexOf(value) + 1) % TAB_VALUES.length
            setValue(TAB_VALUES[next])
          }}
        >
          Next
        </DemoButton>
        <span className="text-sm text-muted-foreground">
          Currently selected:
          {' '}
          {value}
        </span>
      </div>
    </div>
  )
}
