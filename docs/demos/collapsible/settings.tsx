import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger, Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'
import { IconChevronDown } from '@tabler/icons-react'

// 折叠掉不常改的高级选项:常用项常驻,trigger 之后是一个 panel。
// 内边距写在 panel 里面的元素上 —— 写在 panel 自己身上会被高度动画一起压扁
export default function SettingsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4 inline-80">
      <Field className="flex flex-row items-center justify-between gap-4">
        <FieldLabel htmlFor="settings-notify">桌面通知</FieldLabel>
        <Switch defaultChecked id="settings-notify" />
      </Field>

      <Collapsible className="flex flex-col">
        <CollapsibleTrigger
          className="group/trigger -mx-2 justify-between"
          render={<Button size="sm" variant="ghost" />}
        >
          高级选项
          <IconChevronDown className="
            transition-transform
            group-data-panel-open/trigger:rotate-180
          "
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-4 pbs-4">
            <Field className="flex flex-row items-center justify-between gap-4">
              <FieldLabel htmlFor="settings-beta">加入 Beta 通道</FieldLabel>
              <Switch id="settings-beta" />
            </Field>
            <Field className="flex flex-row items-center justify-between gap-4">
              <FieldLabel htmlFor="settings-telemetry">发送匿名使用数据</FieldLabel>
              <Switch id="settings-telemetry" />
            </Field>
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
