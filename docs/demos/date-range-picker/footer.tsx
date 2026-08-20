import type { ReactElement } from 'react'
import {
  DateRangePicker,
  DateRangePickerCancel,
  DateRangePickerClose,
  DateRangePickerFooter,
  DateRangePickerFooterClear,
  DateRangePickerPopup,
} from '@gedatou/cadenza-ui'

// Confirm mode for ranges: both picks are only staged, and the panel
// stays open for review once you're done; DateRangePickerClose commits
// and closes -- a range earns a confirmation step more than a single day.
export default function FooterDemo(): ReactElement {
  return (
    <DateRangePicker
      aria-label="Date range"
      endPlaceholder="End date"
      startPlaceholder="Start date"
    >
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DateRangePickerPopup>
            <DateRangePickerFooter>
              <DateRangePickerFooterClear className="me-auto" variant="ghost">Clear</DateRangePickerFooterClear>
              <DateRangePickerCancel variant="outline">Cancel</DateRangePickerCancel>
              <DateRangePickerClose>OK</DateRangePickerClose>
            </DateRangePickerFooter>
          </DateRangePickerPopup>
        </>
      )}
    </DateRangePicker>
  )
}
