import type { ReactElement } from 'react'
import { Bell, Heart, Search, Send, Settings, Trash2, Upload, X } from '@gedatou/cadenza-ui/icons'

// A row of everyday icons, each playing its own animation on hover — the bell
// swings, the cog turns, the heart beats.
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-6 text-foreground">
      <Bell animateOnHover />
      <Settings animateOnHover />
      <Heart animateOnHover />
      <Search animateOnHover />
      <Send animateOnHover />
      <Upload animateOnHover />
      <Trash2 animateOnHover />
      <X animateOnHover />
    </div>
  )
}
