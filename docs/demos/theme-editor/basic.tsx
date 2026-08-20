import type { ReactElement } from 'react'
import { ThemeEditor } from '@gedatou/cadenza-ui'

// The library component floats fixed at the viewport's bottom-right by
// default; this demo overrides it inline and static via className.
// storageKey={null} keeps the demo instance out of localStorage, so it
// never fights the site's global bottom-right instance over the same
// storage. Injection is document-wide -- edit a token here and the whole
// site follows immediately
export default function BasicDemo(): ReactElement {
  return <ThemeEditor className="static items-start" defaultOpen storageKey={null} />
}
