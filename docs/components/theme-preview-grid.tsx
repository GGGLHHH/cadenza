'use client'

import type { ReactElement } from 'react'
import { DemoRenderer } from '@/demos'

// themes 页正文的组件预览网格;主题编辑器本体已提升进 cadenza-ui,
// 由 docs layout 挂全局实例
// 每个组件一个代表性 demo;Calendar 无独立 demo 组,由 DatePicker 覆盖
const PREVIEWS: { title: string, name: string, wide?: boolean }[] = [
  { title: 'Button', name: 'button/variants' },
  { title: 'Toggle', name: 'toggle/variants' },
  { title: 'ToggleGroup', name: 'toggle-group/basic' },
  { title: 'Spinner', name: 'spinner/basic' },
  { title: 'Input', name: 'input/basic' },
  { title: 'Textarea', name: 'textarea/basic' },
  { title: 'InputGroup', name: 'input-group/icon' },
  { title: 'NumberField', name: 'number-field/basic' },
  { title: 'SearchField', name: 'search-field/basic' },
  { title: 'InputOTP', name: 'input-otp/basic' },
  { title: 'Checkbox', name: 'checkbox/basic' },
  { title: 'RadioGroup', name: 'radio-group/basic' },
  { title: 'Switch', name: 'switch/basic' },
  { title: 'Slider', name: 'slider/basic' },
  { title: 'ColorPicker', name: 'color-picker/basic' },
  { title: 'Select', name: 'select/basic' },
  { title: 'Combobox', name: 'combobox/basic' },
  { title: 'InfiniteSelect', name: 'infinite-select/single' },
  { title: 'InfiniteCombobox', name: 'field/infinite-combobox' },
  { title: 'Cascader', name: 'cascader/basic' },
  { title: 'DatePicker', name: 'date-picker/basic' },
  { title: 'DateRangePicker', name: 'date-range-picker/basic' },
  { title: 'Tabs', name: 'tabs/basic' },
  { title: 'Collapsible', name: 'collapsible/basic' },
  { title: 'Dialog', name: 'dialog/basic' },
  { title: 'AlertDialog', name: 'alert-dialog/basic' },
  { title: 'DropdownMenu', name: 'dropdown-menu/basic' },
  { title: 'LoadingOverlay', name: 'loading-overlay/basic' },
  { title: 'ScrollArea', name: 'scroll-area/basic' },
  { title: 'Stepper', name: 'stepper/basic', wide: true },
  { title: 'Field', name: 'field/basic', wide: true },
  { title: 'Field 无效态', name: 'field/error', wide: true },
  { title: 'DataTable', name: 'data-table/basic', wide: true },
  { title: 'DataPagination', name: 'data-pagination/basic', wide: true },
  { title: '表单(cadenza-form)', name: 'tanstack-form/basic', wide: true },
]

export function ThemePreviewGrid(): ReactElement {
  return (
    <div
      data-not-typeset=""
      className="
        grid gap-4 pbs-6
        sm:grid-cols-2
      "
    >
      {PREVIEWS.map(preview => (
        <section
          key={preview.name}
          className={`
            flex flex-col overflow-hidden rounded-xl border
            ${preview.wide === true ? 'sm:col-span-2' : ''}
          `}
        >
          <div className="border-be px-4 py-2 text-sm font-medium">
            {preview.title}
          </div>
          <div className="
            flex flex-1 items-center justify-center p-6 min-block-40
          "
          >
            <DemoRenderer name={preview.name} />
          </div>
        </section>
      ))}
    </div>
  )
}
