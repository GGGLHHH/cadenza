import type { DateRange } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import {
  fieldErrors,
  fieldInvalidState,
  formProps,
  useForm,
} from '@gedatou/cadenza-form'
import {
  Button,
  DateRangePicker,
  DateRangePickerClear,
  DateRangePickerEndInput,
  DateRangePickerStartInput,
  DateRangePickerTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputGroup,
} from '@gedatou/cadenza-ui'
import { IconArrowNarrowRight } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

// DateRangePicker 绑定:值是 { from, to } | null,选到一半是 { from }
// (to 还空着)也会入表 —— 完整性用 refine 把关,半程和空值给同一句文案。
const schema = z.object({
  stay: z
    .object({ from: z.date(), to: z.date().optional() })
    .nullable()
    .refine(value => value !== null && value.to !== undefined, '请选择完整的入住区间'),
})

export default function DateRangePickerDemo(): ReactElement {
  const form = useForm({
    defaultValues: { stay: null as DateRange | null },
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
        <form.Field name="stay">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>入住区间</FieldLabel>
                <DateRangePicker
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value)}
                >
                  <InputGroup>
                    <DateRangePickerStartInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="入住"
                      onBlur={field.handleBlur}
                    />
                    <IconArrowNarrowRight
                      aria-hidden
                      className="
                        shrink-0 text-muted-foreground block-4 inline-4
                      "
                    />
                    <DateRangePickerEndInput
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
                      placeholder="退房"
                      onBlur={field.handleBlur}
                    />
                    <DateRangePickerClear />
                    <DateRangePickerTrigger />
                  </InputGroup>
                </DateRangePicker>
                <FieldDescription>日历里第一次点定起点，第二次点收尾。</FieldDescription>
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
