import type { ReactElement } from 'react'
import { Calendar, DatePicker, DatePickerPopup } from '@gedatou/cadenza-ui'
import { zhCN } from 'date-fns/locale'

// The year and month in the panel caption are dropdowns themselves -- no
// stepping through arrows page by page. They are on by default: the basic
// demo has them as soon as it opens. This demo shows three related things:
//
// 1. locale: controls every "formatted" string -- the weekday row, month
//    names, the value in the input. It lives on the root because parsing
//    typed text needs it too.
// 2. labels: controls the "spoken" strings. rdp ships a set of hardcoded
//    English literals (Choose the Year / Go to the Previous Month...)
//    that locale cannot reach; they can only be translated from here.
// 3. startMonth / endMonth: the year range defaults to this year ±100.
//    A birthday field needs to go much further back, and not even one
//    year forward.
//
// The last two only affect the panel, not the input, so they take the
// same route as every other calendar config: the popup's function
// children, with no extra props on the root.
export default function CaptionNavDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="Date of birth"
      format="yyyy年MM月dd日"
      locale={zhCN}
      placeholder="Pick a date of birth"
    >
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DatePickerPopup>
            {calendar => (
              <Calendar
                {...calendar}
                endMonth={new Date(new Date().getFullYear(), 11)}
                labels={{
                  labelMonthDropdown: () => '选择月份',
                  labelNext: () => '下一月',
                  labelPrevious: () => '上一月',
                  labelYearDropdown: () => '选择年份',
                }}
                startMonth={new Date(1950, 0)}
              />
            )}
          </DatePickerPopup>
        </>
      )}
    </DatePicker>
  )
}
