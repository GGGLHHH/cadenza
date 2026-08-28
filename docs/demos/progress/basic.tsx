import type { ReactElement } from 'react'
import { Progress } from '@gedatou/cadenza-ui'
import { useEffect, useState } from 'react'

// The bare bar: `value` in, track and indicator rendered for you — it moves
// here only so the transition on the indicator is visible
export default function BasicDemo(): ReactElement {
  const [value, setValue] = useState(13)
  useEffect(() => {
    const id = setTimeout(setValue, 500, 66)
    return () => clearTimeout(id)
  }, [])
  return (
    <Progress
      value={value}
      aria-label="Loading"
      className="inline-full max-inline-sm"
    />
  )
}
