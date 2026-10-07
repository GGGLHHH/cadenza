import type { ReactElement } from 'react'
import {
  DateTimePicker,
  DateTimePickerCancel,
  DateTimePickerClose,
  DateTimePickerFooter,
  DateTimePickerFooterClear,
  DateTimePickerPopup,
} from '@gedatou/cadenza-ui'

// Composing Footer switches on confirm mode: day and time picks are only
// staged (the input previews live); DateTimePickerClose (or Enter) commits
// both at once, while DateTimePickerCancel, Esc, and outside clicks discard
// them. Button copy and variants are the caller's to write.
export default function FooterDemo(): ReactElement {
  return (
    <DateTimePicker aria-label="Date and time" placeholder="Pick, then confirm">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DateTimePickerPopup>
            <DateTimePickerFooter>
              <DateTimePickerFooterClear className="me-auto" variant="ghost">Clear</DateTimePickerFooterClear>
              <DateTimePickerCancel variant="outline">Cancel</DateTimePickerCancel>
              <DateTimePickerClose>OK</DateTimePickerClose>
            </DateTimePickerFooter>
          </DateTimePickerPopup>
        </>
      )}
    </DateTimePicker>
  )
}
