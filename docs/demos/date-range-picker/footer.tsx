import type { ReactElement } from 'react'
import {
  DateRangePicker,
  DateRangePickerCancel,
  DateRangePickerClose,
  DateRangePickerFooter,
  DateRangePickerFooterClear,
  DateRangePickerPopup,
} from '@gedatou/cadenza-ui'

// 区间的确认模式:两次点选都只是暂存,选完面板留着给你检查,
// DateRangePickerClose 才提交并关闭 —— 选区间比选单日更值得一道确认。
export default function FooterDemo(): ReactElement {
  return (
    <DateRangePicker
      aria-label="日期范围"
      endPlaceholder="结束日期"
      startPlaceholder="开始日期"
    >
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DateRangePickerPopup>
            <DateRangePickerFooter>
              <DateRangePickerFooterClear className="me-auto" variant="ghost">清除</DateRangePickerFooterClear>
              <DateRangePickerCancel variant="outline">取消</DateRangePickerCancel>
              <DateRangePickerClose>确定</DateRangePickerClose>
            </DateRangePickerFooter>
          </DateRangePickerPopup>
        </>
      )}
    </DateRangePicker>
  )
}
