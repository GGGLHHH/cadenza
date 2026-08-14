import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Cascader,
  CascaderTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@gedatou/cadenza-ui'
import { toast } from 'sonner'
import { z } from 'zod'

// Cascader 绑定:与 Select 同型——表单里存整条路径(string[],空为 null),
// 受控走 value/onValueChange,name 归根(隐藏 input 序列化)、id 落在
// CascaderTrigger 上,aria 接线用 fieldInvalidState 手工分发。
const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    items: [
      { value: 'hangzhou', label: '杭州', items: [{ value: 'xihu', label: '西湖区' }, { value: 'binjiang', label: '滨江区' }] },
      { value: 'ningbo', label: '宁波', items: [{ value: 'haishu', label: '海曙区' }] },
    ],
  },
  { value: 'beijing', label: '北京' },
]

const schema = z.object({
  region: z.array(z.string()).nullable().refine(path => path !== null, '请选择所在地区'),
})

export default function CascaderDemo(): ReactElement {
  const form = useForm({
    defaultValues: { region: null as string[] | null },
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
        <form.Field name="region">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="responsive" data-invalid={invalid || undefined}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>地区</FieldLabel>
                  <FieldDescription>配送范围按地区结算。</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
                <Cascader
                  items={REGIONS}
                  name={field.name}
                  placeholder="选择地区"
                  value={field.state.value}
                  onValueChange={path => field.handleChange(path)}
                >
                  <CascaderTrigger
                    id={field.name}
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    aria-required
                  />
                </Cascader>
              </Field>
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
