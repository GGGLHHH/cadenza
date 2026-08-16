import type { ReactElement } from 'react'
import { Calendar, DatePicker, DatePickerPopup } from '@gedatou/cadenza-ui'

// 弹层的函数 children 拿到 seam 接好线的日历 props(mode/selected/
// onSelect/month…),spread 进自己的 <Calendar> 再往上叠配置 ——
// 这里换成年月下拉导航。组合了 DatePickerPopup,默认弹层自动让位。
export default function CustomCalendarDemo(): ReactElement {
  return (
    <DatePicker aria-label="生日" placeholder="选择生日">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DatePickerPopup>
            {calendar => (
              <Calendar
                {...calendar}
                captionLayout="dropdown"
                endMonth={new Date(2030, 11)}
                startMonth={new Date(1950, 0)}
              />
            )}
          </DatePickerPopup>
        </>
      )}
    </DatePicker>
  )
}
