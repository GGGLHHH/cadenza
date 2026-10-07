import type { ReactElement } from 'react'
import {
  TimePicker,
  TimePickerCancel,
  TimePickerClose,
  TimePickerFooter,
  TimePickerFooterClear,
  TimePickerPopup,
} from '@gedatou/cadenza-ui'

// Composing Footer switches on confirm mode: picks and typing are only
// staged (the input previews live); TimePickerClose (or Enter) commits,
// while TimePickerCancel, Esc, and outside clicks discard the staged value.
// Button copy and variants are the caller's to write.
export default function FooterDemo(): ReactElement {
  return (
    <TimePicker aria-label="Time" placeholder="Pick, then confirm">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <TimePickerPopup>
            <TimePickerFooter>
              <TimePickerFooterClear className="me-auto" variant="ghost">Clear</TimePickerFooterClear>
              <TimePickerCancel variant="outline">Cancel</TimePickerCancel>
              <TimePickerClose>OK</TimePickerClose>
            </TimePickerFooter>
          </TimePickerPopup>
        </>
      )}
    </TimePicker>
  )
}
