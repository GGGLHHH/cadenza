import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'

// box-only:根元素就是那个 16px 方块,文字走同级的 FieldLabel htmlFor → Checkbox id。
// id 落在隐藏的 <input> 上,一条 htmlFor 同时买下「点文字切换」和无障碍名。
// 横排 + 描述时用 FieldContent 装「标签 + 描述」的文本块。
export default function BasicDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field orientation="horizontal">
        <Checkbox defaultChecked id="checkbox-basic-newsletter" name="newsletter" />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-basic-newsletter">乐季简报</FieldLabel>
          <FieldDescription>新的场次开票时给你发一封邮件。</FieldDescription>
        </FieldContent>
      </Field>
      <Field data-disabled orientation="horizontal">
        <Checkbox disabled id="checkbox-basic-sms" name="sms" />
        <FieldLabel htmlFor="checkbox-basic-sms">短信提醒</FieldLabel>
      </Field>
    </FieldGroup>
  )
}
