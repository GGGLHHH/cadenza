import type { ReactElement } from 'react'
import { LinkButton } from '@gedatou/cadenza-ui'

// A link dressed as a button: has href, can be disabled. When disabled the
// href is removed entirely; the dimming relies on data-disabled
// (:disabled never matches on a link)
export default function LinkDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="https://base-ui.com/react/overview/quick-start" target="_blank">
        Base UI docs
      </LinkButton>
      <LinkButton href="https://base-ui.com/react/overview/quick-start" target="_blank" variant="outline">
        Outline
      </LinkButton>
      <LinkButton href="https://base-ui.com/react/overview/quick-start" disabled>
        Disabled link
      </LinkButton>
    </div>
  )
}
