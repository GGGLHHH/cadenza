import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// 一批相关字段:FieldSet + FieldLegend 给整组命名(语义是原生
// fieldset/legend),FieldGroup 负责纵向排布
export default function FieldsetDemo(): ReactElement {
  return (
    <FieldSet className="max-inline-sm">
      <FieldLegend>演出信息</FieldLegend>
      <FieldDescription>将原样印在节目单上。</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fieldset-piece">曲目</FieldLabel>
          <InputGroup>
            <InputGroupInput id="fieldset-piece" placeholder="水之嬉戏" />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="fieldset-composer">作曲家</FieldLabel>
          <InputGroup>
            <InputGroupInput id="fieldset-composer" placeholder="拉威尔" />
          </InputGroup>
          <FieldDescription>拿不准就先留空。</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
