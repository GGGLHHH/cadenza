import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'

// One-liner: omit children and the full default composition renders — trigger,
// value display, clear ✕, popup, and options all come from items. Clear is on
// by default (turn it off with clearable={false}).
// Write children only when customising a layer; see "Groups" for composition.
const VOICES = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Tenor',
  bass: 'Bass',
}

export default function BasicDemo(): ReactElement {
  return <Select aria-label="Voice part" items={VOICES} placeholder="Pick a voice part" />
}
