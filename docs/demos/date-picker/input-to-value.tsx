import type { ReactElement } from 'react'
import { DatePicker } from '@gedatou/cadenza-ui'
import { isValid, parse } from 'date-fns'

// inputToValue 只换解析:显示仍走 format,键入宽容收多种写法。
// 试试「2026/8/1」「2026-8-1」「20260801」—— 都能落值,失焦后统一
// 显示成 yyyy-MM-dd。
const FORMATS = ['yyyy-MM-dd', 'yyyy/M/d', 'yyyy-M-d', 'yyyyMMdd']

function parseLoose(text: string): Date | null {
  const trimmed = text.trim()
  for (const format of FORMATS) {
    const parsed = parse(trimmed, format, new Date())
    if (isValid(parsed))
      return parsed
  }
  return null
}

export default function InputToValueDemo(): ReactElement {
  return (
    <DatePicker
      aria-label="日期"
      inputToValue={parseLoose}
      placeholder="2026/8/1、20260801 都认"
    />
  )
}
