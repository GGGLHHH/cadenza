import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from '@gedatou/cadenza-ui'

// box-only 控件:根元素就是方框 / 轨道本身,文字只能走外部 FieldLabel。
// 三点和前面的触发器类控件不同:orientation="horizontal"(控件在前、文字在后)、
// id 落在隐藏 <input> 上、要带描述就用 FieldContent 把「标签 + 描述」装成一列
export default function BoxControlsDemo(): ReactElement {
  return (
    <FieldGroup className="inline-full max-inline-sm">
      <Field orientation="horizontal">
        <Checkbox defaultChecked id="field-box-newsletter" name="newsletter" />
        <FieldContent>
          <FieldLabel htmlFor="field-box-newsletter">乐季简报</FieldLabel>
          <FieldDescription>新的场次开票时给你发一封邮件。</FieldDescription>
        </FieldContent>
      </Field>

      <Field orientation="horizontal">
        <Switch id="field-box-notify" name="notify" />
        <FieldLabel htmlFor="field-box-notify">排练提醒</FieldLabel>
      </Field>

      {/* 一组互斥选项:每一项各自是一个 horizontal 的 Field;
          组本身的名字靠 FieldLegend 的 id + RadioGroup 的 aria-labelledby 手接 */}
      <FieldSet>
        <FieldLegend variant="label" id="field-box-seat">座位偏好</FieldLegend>
        <RadioGroup aria-labelledby="field-box-seat" defaultValue="stalls" name="seat">
          <Field orientation="horizontal">
            <RadioGroupItem id="field-box-stalls" value="stalls" />
            <FieldLabel htmlFor="field-box-stalls">池座</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="field-box-balcony" value="balcony" />
            <FieldLabel htmlFor="field-box-balcony">楼座</FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  )
}
