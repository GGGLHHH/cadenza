import type { ReactElement } from 'react'
import { TimeColumns, TimePicker, TimePickerPopup } from '@gedatou/cadenza-ui'

// The popup's function children receive the columns props the seam has
// already wired (value, onValueChange, granularity, minuteStep, bounds).
// Spread them into your own <TimeColumns> and layer config on top -- here
// the columns' accessible names, which the library leaves in English.
export default function CustomColumnsDemo(): ReactElement {
  return (
    <TimePicker aria-label="时间" placeholder="选择时间">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <TimePickerPopup>
            {columns => <TimeColumns {...columns} labels={{ hours: '时', minutes: '分' }} />}
          </TimePickerPopup>
        </>
      )}
    </TimePicker>
  )
}
