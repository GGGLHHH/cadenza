import type { Combobox } from '@base-ui/react/combobox'
import type { ReactElement, ReactNode } from 'react'
import { createContext } from 'react'

/**
 * How `InfiniteCombobox` puts `InfiniteSelect` in a popup. Base UI's
 * `Combobox.Popup` only works under a non-inline `Combobox.Root`, and
 * animate-ui's row motion (staggered entrance, gliding highlight, held checks)
 * only lives in that popup — so the panel's root becomes the popup's root,
 * and `wrap` renders the trigger and popup shell around the panel.
 *
 * Private: in `#lib`, never re-exported, so the package's public surface stays
 * the two components.
 */
export interface InfiniteSelectHost {
  open: boolean
  onOpenChange: (open: boolean, eventDetails: Combobox.Root.ChangeEventDetails) => void
  modal: boolean
  wrap: (panel: ReactElement) => ReactNode
}

export const InfiniteSelectHostContext = createContext<InfiniteSelectHost | null>(null)
