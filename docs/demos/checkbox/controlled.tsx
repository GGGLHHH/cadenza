import type { ReactElement } from 'react'
import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// 受控:checked 是唯一数据源,onCheckedChange 负责写回。
// 第二参是真的 ChangeEventDetails —— reason 恒为 'none',cancel() 会被尊重。
export default function ControlledDemo(): ReactElement {
  const [checked, setChecked] = useState(false)
  const [locked, setLocked] = useState(false)
  const [log, setLog] = useState('还没有变更')

  return (
    <FieldGroup className="max-inline-sm">
      <Field orientation="horizontal">
        <Checkbox
          checked={checked}
          id="checkbox-controlled-consent"
          onCheckedChange={(next, details) => {
            if (locked) {
              // 拒绝这次变更:外部 state 不写回,组件内部那份也被 cancel() 挡下
              details.cancel()
              setLog(`已拦截(reason = ${details.reason})`)
              return
            }
            setChecked(next)
            setLog(`${next ? '已勾选' : '已取消'}(reason = ${details.reason})`)
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-controlled-consent">同意演出条款</FieldLabel>
          <FieldDescription>{log}</FieldDescription>
        </FieldContent>
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <DemoButton onClick={() => setLocked(current => !current)} size="sm">
          {locked ? '解除锁定' : '锁定(之后的变更一律 cancel)'}
        </DemoButton>
      </div>
      <Field orientation="horizontal">
        {/* 非受控:没有任何外部 state,取消勾选那一下光靠 cancel() 就钉住了 */}
        <Checkbox
          defaultChecked
          id="checkbox-controlled-sticky"
          onCheckedChange={(next, details) => {
            if (!next)
              details.cancel()
          }}
        />
        <FieldContent>
          <FieldLabel htmlFor="checkbox-controlled-sticky">保留座位(勾上就不能取消)</FieldLabel>
          <FieldDescription>非受控,cancel() 直接拦住内部状态。</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
