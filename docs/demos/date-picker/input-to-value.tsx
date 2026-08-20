import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { isValid, parse } from 'date-fns'

// inputToValue swaps only the parser: display still follows format while
// typing accepts several spellings. Try "2026/8/1", "2026-8-1" or
// "20260801" -- each lands as a value, and after blur the display
// normalizes to yyyy-MM-dd.
const FORMATS = ['yyyy-MM-dd', 'yyyy/M/d', 'yyyy-M-d', 'yyyyMMdd']

function parseLoose(text: string): Date | null {
  const trimmed = text.trim()
  for (const format of FORMATS) {
    const parsed = parse(trimmed, format, new Date())
    if (isValid(parsed))
      return parsed
  }
  return null
}

export default function InputToValueDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="Date"
      inputToValue={parseLoose}
      placeholder="Accepts 2026/8/1, 20260801"
    />
  )
}
