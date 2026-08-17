import type { ReactElement } from 'react'
import { Calendar, DatePicker, DatePickerPopup } from '@gedatou/cadenza-ui'
import { zhCN } from 'date-fns/locale'

// 面板顶上的年、月本身就是下拉,不用一格格翻箭头 —— 默认在场,basic
// demo 打开就有。这里演示三件跟它有关的事:
//
// 1. locale:管所有「格式化出来的」文案 —— 星期行、月份名、输入框里的值。
//    它在根上,因为解析键入的文本也要用它。
// 2. labels:管「朗读出来的」文案。rdp 有一批写死的英文字面量(Choose the
//    Year / Go to the Previous Month…),locale 碰不到,只能从这里翻。
// 3. startMonth / endMonth:年份范围默认今年 ±100,生日场景往回要得多、
//    往前一年都不需要。
//
// 后两个只影响面板、不影响输入框,所以和别的日历配置走同一条路:弹层的
// 函数 children,不往根上开口子。
export default function CaptionNavDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="出生日期"
      format="yyyy年MM月dd日"
      locale={zhCN}
      placeholder="选择出生日期"
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
