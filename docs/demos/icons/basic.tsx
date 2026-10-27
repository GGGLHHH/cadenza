import type { ReactElement } from 'react'
import { BellIcon, HeartIcon, SearchIcon, SendIcon, SettingsIcon, Trash2Icon, UploadIcon, XIcon } from '@gedatou/cadenza-icons'

// A row of everyday icons, each playing its own animation on hover — the bell
// swings, the cog turns, the heart beats.
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-6 text-foreground">
      <BellIcon animateOnHover />
      <SettingsIcon animateOnHover />
      <HeartIcon animateOnHover />
      <SearchIcon animateOnHover />
      <SendIcon animateOnHover />
      <UploadIcon animateOnHover />
      <Trash2Icon animateOnHover />
      <XIcon animateOnHover />
    </div>
  )
}
