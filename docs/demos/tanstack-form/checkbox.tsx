import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Checkbox 列表 = mode="array" 的数组字段:pushValue/removeValue 是 tanstack 原生 API,
// 经门面原样可用;错误挂在 FieldSet 级,各项只接 aria 线
const TASKS = [
  { id: 'attendance', label: '出勤统计' },
  { id: 'sheets', label: '乐谱整理' },
  { id: 'warmup', label: '开声带练' },
] as const

const schema = z.object({
  tasks: z.array(z.string()).min(1, '至少认领一项任务'),
})

export default function CheckboxDemo(): ReactElement {
  const form = useForm({
    defaultValues: { tasks: [] as string[] },
    validators: { onChange: schema },
    onSubmit: ({ formApi, value }) => {
      toast('已提交以下内容：', {
        description: (
          <pre className="
            mbs-2 overflow-x-auto rounded-md bg-code p-4 text-code-foreground
            inline-[320px]
          "
          >
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        ),
      })
      formApi.reset()
    },
  })

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="tasks" mode="array">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <FieldSet data-invalid={invalid || undefined}>
                <FieldLegend variant="label">乐季任务</FieldLegend>
                <FieldDescription>认领的任务有更新时会通知你。</FieldDescription>
                <FieldGroup>
                  {TASKS.map(task => (
                    <Field key={task.id} orientation="horizontal">
                      <Checkbox
                        id={`tasks-${task.id}`}
                        name={field.name}
                        checked={field.state.value.includes(task.id)}
                        aria-describedby={errorId}
                        aria-invalid={invalid}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.pushValue(task.id)
                            return
                          }
                          const index = field.state.value.indexOf(task.id)
                          if (index > -1)
                            void field.removeValue(index)
                        }}
                      />
                      <FieldLabel htmlFor={`tasks-${task.id}`}>
                        {task.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
                <FieldError id={errorId} errors={fieldErrors(field)} />
              </FieldSet>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit">提交</Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
