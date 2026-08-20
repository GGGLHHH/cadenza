import type { ReactElement } from 'react'
import { Calendar, DatePicker, DatePickerPopup } from '@gedatou/cadenza-ui'

// The popup's function children receive the calendar props the seam has
// already wired (mode/selected/onSelect/month/captionLayout...). Spread
// them into your own <Calendar> and layer config on top -- here two
// months side by side with week numbers. Composing DatePickerPopup makes
// the default popup step aside automatically; the year/month dropdowns
// stay in place because they also ride in the spread props.
export default function CustomCalendarDemo(): ReactElement {
  return (
    <DatePicker aria-label="Date" placeholder="Pick a date">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DatePickerPopup>
            {calendar => <Calendar {...calendar} numberOfMonths={2} showWeekNumber />}
          </DatePickerPopup>
        </>
      )}
    </DatePicker>
  )
}
