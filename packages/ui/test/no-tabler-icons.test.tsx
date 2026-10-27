import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbList,
  BreadcrumbSeparator,
  Calendar,
  Checkbox,
  DataPagination,
  DatePicker,
  Dialog,
  DialogPopup,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerProvider,
  NumberField,
  SearchField,
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
  SidebarProvider,
  SidebarTrigger,
  Spinner,
} from '../src'

/**
 * The published components draw their icons from the animated set. Several
 * vendored parts underneath still import Tabler (they are byte-pinned); the
 * seam overrides each of those. This walks the parts that had one and fails
 * if a Tabler svg reaches the DOM — the drawn icons are Tabler shapes too, so
 * they are told apart by animate-ui's path class.
 */
const TABLER = 'svg.tabler-icon:not(.animate-ui-icon-path)'

const otp = (
  <InputOTP aria-label="验证码" key="o" maxLength={2}>
    <InputOTPGroup><InputOTPSlot index={0} /></InputOTPGroup>
    <InputOTPSeparator />
    <InputOTPGroup><InputOTPSlot index={1} /></InputOTPGroup>
  </InputOTP>
)
const select = (
  <Select defaultOpen defaultValue="a" items={[{ label: 'A', value: 'a' }]} key="sel">
    <SelectTrigger aria-label="选项"><SelectValue /></SelectTrigger>
    <SelectPopup><SelectItem value="a">A</SelectItem></SelectPopup>
  </Select>
)
const breadcrumb = (
  <Breadcrumb key="b">
    <BreadcrumbList>
      <BreadcrumbEllipsis />
      <BreadcrumbSeparator />
    </BreadcrumbList>
  </Breadcrumb>
)

const cases: [string, ReactElement][] = [
  ['Breadcrumb', breadcrumb],
  ['Calendar', <Calendar key="c" mode="single" month={new Date(2026, 7, 1)} />],
  ['Calendar dropdown', <Calendar captionLayout="dropdown" key="cd" mode="single" month={new Date(2026, 7, 1)} />],
  ['Checkbox', <Checkbox aria-label="同意" defaultChecked key="cb" />],
  ['DataPagination', <DataPagination key="p" total={100} />],
  ['DatePicker', <DatePicker aria-label="日期" defaultValue={new Date(2026, 7, 16)} key="dp" />],
  ['Dialog', <Dialog defaultOpen key="d"><DialogPopup><DialogTitle>标题</DialogTitle></DialogPopup></Dialog>],
  ['InputOTP', otp],
  ['MessageScrollerButton', <MessageScrollerProvider key="m"><MessageScroller><MessageScrollerButton /></MessageScroller></MessageScrollerProvider>],
  ['NumberField', <NumberField aria-label="数量" defaultValue={1} key="n" />],
  ['SearchField', <SearchField aria-label="搜索" defaultValue="x" key="s" />],
  ['Select', select],
  ['SidebarTrigger', <SidebarProvider key="sb"><SidebarTrigger /></SidebarProvider>],
  ['Spinner', <Spinner key="sp" />],
]

it.each(cases)('%s renders no Tabler icon', (_, element) => {
  const { baseElement } = render(element)
  expect(baseElement.querySelector('svg'), 'renders an icon at all').not.toBeNull()
  expect(baseElement.querySelectorAll(TABLER)).toHaveLength(0)
})
