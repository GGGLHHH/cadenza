import type { ReactElement } from 'react'
import {
  DatePicker,
  DatePickerCancel,
  DatePickerClose,
  DatePickerFooter,
  DatePickerFooterClear,
  DatePickerPopup,
} from '@gedatou/cadenza-ui'

// Composing Footer switches on confirm mode: picking and typing are only
// staged (the input previews live); DatePickerClose (or Enter) commits,
// while DatePickerCancel, Esc, and outside clicks discard the staged
// value. Button copy and variants are the caller's to write -- the same
// shape as AlertDialogFooter.
export default function FooterDemo(): ReactElement {
  return (
    <DatePicker aria-label="Date" placeholder="Pick, then confirm">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DatePickerPopup>
            <DatePickerFooter>
              <DatePickerFooterClear className="me-auto" variant="ghost">Clear</DatePickerFooterClear>
              <DatePickerCancel variant="outline">Cancel</DatePickerCancel>
              <DatePickerClose>OK</DatePickerClose>
            </DatePickerFooter>
          </DatePickerPopup>
        </>
      )}
    </DatePicker>
  )
}
