import type { ReactElement } from 'react'
import { SettingsDialog } from './components/settings-dialog'

// shadcn's sidebar-13 block: a settings dialog with a non-collapsible Sidebar
// (collapsible="none") as its navigation column.
export default function SidebarBlock13(): ReactElement {
  return (
    <div className="flex items-center justify-center py-16">
      <SettingsDialog />
    </div>
  )
}
