import type { ReactElement } from 'react'
import {
  DatePicker,
  DatePickerCancel,
  DatePickerClose,
  DatePickerFooter,
  DatePickerFooterClear,
  DatePickerPopup,
} from '@gedatou/cadenza-ui'

// 组合 Footer 即进入确认模式:点选、键入都只是暂存(输入框实时预览),
// DatePickerClose(或 Enter)才提交;DatePickerCancel、Esc、点外部丢弃
// 暂存。按钮文案与 variant 都由使用方写 —— AlertDialogFooter 同款形态。
export default function FooterDemo(): ReactElement {
  return (
    <DatePicker aria-label="日期" placeholder="选择后需确认">
      {({ defaultChildren }) => (
        <>
          {defaultChildren}
          <DatePickerPopup>
            <DatePickerFooter>
              <DatePickerFooterClear className="me-auto" variant="ghost">清除</DatePickerFooterClear>
              <DatePickerCancel variant="outline">取消</DatePickerCancel>
              <DatePickerClose>确定</DatePickerClose>
            </DatePickerFooter>
          </DatePickerPopup>
        </>
      )}
    </DatePicker>
  )
}
