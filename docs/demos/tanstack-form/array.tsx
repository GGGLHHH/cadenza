import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

// 数组字段:mode="array" + pushValue/removeValue 是 tanstack 原生能力,
// 经门面原样可用;子字段照常走 fieldControlProps/fieldErrors
const schema = z.object({
  emails: z
    .array(z.object({ address: z.email('请输入有效的邮箱地址') }))
    .min(1, '至少填一个邮箱')
    .max(5, '最多 5 个邮箱'),
})

export default function ArrayDemo(): ReactElement {
  const form = useForm({
    defaultValues: { emails: [{ address: '' }] },
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
        <form.Field name="emails" mode="array">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <FieldSet data-invalid={invalid || undefined}>
                <FieldLegend variant="label">联系邮箱</FieldLegend>
                <FieldDescription>最多 5 个，用于接收排练通知。</FieldDescription>
                <FieldGroup>
                  {field.state.value.map((_, index) => (
                    // 数组字段按位置寻址,index 就是身份 —— 这里用它当 key 是对的
                    // eslint-disable-next-line react/no-array-index-key
                    <form.Field key={index} name={`emails[${index}].address`}>
                      {(subField) => {
                        const sub = fieldInvalidState(subField)
                        return (
                          <Field data-invalid={sub.invalid || undefined}>
                            <InputGroup>
                              <InputGroupInput
                                {...fieldControlProps(subField)}
                                value={subField.state.value}
                                aria-label={`邮箱 ${index + 1}`}
                                placeholder="name@example.com"
                                type="email"
                                onBlur={subField.handleBlur}
                                onChange={event => subField.handleChange(event.target.value)}
                              />
                              {field.state.value.length > 1 && (
                                <InputGroupAddon align="inline-end">
                                  <InputGroupButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`删除第 ${index + 1} 个邮箱`}
                                    onClick={() => void field.removeValue(index)}
                                  >
                                    <IconX aria-hidden />
                                  </InputGroupButton>
                                </InputGroupAddon>
                              )}
                            </InputGroup>
                            <FieldError id={sub.errorId} errors={fieldErrors(subField)} />
                          </Field>
                        )
                      }}
                    </form.Field>
                  ))}
                </FieldGroup>
                <FieldError id={errorId} errors={fieldErrors(field)} />
                <Field orientation="horizontal">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={field.state.value.length >= 5}
                    onClick={() => void field.pushValue({ address: '' })}
                  >
                    添加邮箱
                  </Button>
                </Field>
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
