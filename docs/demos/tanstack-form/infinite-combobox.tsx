import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
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
  FieldLabel,
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// InfiniteCombobox 绑定:单选的受控值是 **id 字符串**(空为 null),
// onValueChange 回传的是对象 —— 表单持久化 id,展示用局部 state 存对象;
// name 会在触发器旁渲染隐藏 input(弹层外,关闭不卸载),triggerId 接 htmlFor
const schema = z.object({
  composerId: z.string().nullable().refine(value => value !== null, '请选择作曲家'),
})

export default function InfiniteComboboxDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | null>(null)
  const form = useForm({
    defaultValues: { composerId: null as string | null },
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
      setPicked(null)
    },
  })

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <form.Field name="composerId">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor="composer-trigger" required>最喜欢的作曲家</FieldLabel>
                <InfiniteCombobox<Person>
                  getOption={getOption}
                  list={list}
                  name={field.name}
                  searchPlaceholder="搜索作曲家…"
                  state={state}
                  triggerId="composer-trigger"
                  value={field.state.value}
                  onValueChange={(item) => {
                    setPicked(item)
                    field.handleChange(item?.id ?? null)
                  }}
                >
                  <DemoButton
                    aria-describedby={errorId}
                    aria-invalid={invalid}
                    className="justify-start inline-full"
                  >
                    {picked ? picked.name : '选择作曲家'}
                  </DemoButton>
                  {selectSlots}
                  <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
                </InfiniteCombobox>
                <FieldDescription>
                  表单持久化的是 id,不是对象。
                </FieldDescription>
                <FieldError id={errorId} errors={fieldErrors(field)} />
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
