import type { ReactElement } from 'react'
import { Calendar, DatePicker, DatePickerPopup } from '@gedatou/cadenza-ui'

// 弹层的函数 children 拿到 seam 接好线的日历 props(mode/selected/
// onSelect/month/captionLayout…),spread 进自己的 <Calendar> 再往上叠
// 配置 —— 这里叠成双月并显示周数。组合了 DatePickerPopup,默认弹层
// 自动让位;年月下拉照旧在场,因为它也在 spread 进来的 props 里。
export default function CustomCalendarDemo(): ReactElement {
  return (
    <DatePicker aria-label="日期" placeholder="选择日期">
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
