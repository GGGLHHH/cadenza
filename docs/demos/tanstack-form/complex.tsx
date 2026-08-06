import type { ReactElement } from 'react'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
  requiredFields,
  useForm,
  useFormSubmitting,
} from '@gedatou/cadenza-form'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
} from '@gedatou/cadenza-ui'
import { IconMail } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

// 综合示例:控件全家 × zod 常见形态 —— 必填/邮箱/数字 coerce/跨字段 superRefine/
// 可选限长/数组 min/布尔 refine/滑杆范围,同一套门面接线贯穿
const VOICE_PARTS = {
  soprano: '女高音',
  alto: '女低音',
  tenor: '男高音',
  bass: '男低音',
} as const

const EXPERIENCE_LEVELS = [
  { id: 'beginner', title: '初学', description: '没有合唱经验,愿意从头学。' },
  { id: 'experienced', title: '有经验', description: '参加过合唱团或声乐训练。' },
] as const

const WEEKDAYS = [
  { id: 'wed', label: '周三晚' },
  { id: 'sat', label: '周六下午' },
  { id: 'sun', label: '周日下午' },
] as const

const schema = z
  .object({
    email: z.email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少 8 位'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, '姓名至少 2 个字'),
    age: z
      .number({ error: '请输入数字' })
      .int('年龄须为整数')
      .min(12, '至少 12 岁')
      .max(90, '最大 90 岁')
      .nullable()
      .refine(value => value !== null, '请填写年龄'),
    bio: z.string().max(100, '简介最多 100 字'),
    voicePart: z.string().min(1, '请选择声部'),
    experience: z.string().min(1, '请选择经验水平'),
    weekdays: z.array(z.string()).min(1, '至少选一个排练时段'),
    weeklyHours: z.number().min(2, '每周至少投入 2 小时'),
    notifications: z.boolean(),
    agreeTerms: z.boolean().refine(value => value, '入团前请先同意排练守则'),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: '两次输入的密码不一致',
      })
    }
  })

const DEFAULT_VALUES = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  age: null as number | null,
  bio: '',
  voicePart: '',
  experience: '',
  weekdays: [] as string[],
  weeklyHours: 0,
  notifications: true,
  agreeTerms: false,
}

// 行为性必填探针:空值过不了校验的字段自动带红星;
// 简介(可留空)与提醒(默认合法)不会被标,确认密码是跨字段必填,探针测不出,手动补
const REQUIRED = requiredFields(schema, DEFAULT_VALUES)

export default function ComplexDemo(): ReactElement {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: schema },
    onSubmit: async ({ formApi, value }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      // validators 只校验不转换:transform 的产物(age 为数字)要在提交时 parse 拿到
      const data = schema.parse(value)
      toast('已提交以下内容：', {
        description: (
          <pre className="
            mbs-2 overflow-x-auto rounded-md bg-code p-4 text-code-foreground
            inline-[320px]
          "
          >
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
      formApi.reset()
    },
  })
  const submitting = useFormSubmitting(form)

  return (
    <form
      {...formProps(form)}
      className="mx-auto inline-full max-inline-sm"
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>账号</FieldLegend>
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>邮箱</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <IconMail aria-hidden />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...fieldControlProps(field)}
                        value={field.state.value}
                        autoComplete="email"
                        placeholder="name@example.com"
                        type="email"
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                      />
                    </InputGroup>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>密码</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>至少 8 位。</FieldDescription>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required>确认密码</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>基本资料</FieldLegend>
          <FieldGroup>
            <form.Field name="fullName">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>姓名</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      autoComplete="name"
                      placeholder="葛大头"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="age">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>年龄</FieldLabel>
                    <NumberField
                      id={field.name}
                      name={field.name}
                      min={12}
                      max={90}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement aria-label="减少" />
                        <NumberFieldInput
                          aria-describedby={errorId}
                          aria-invalid={invalid}
                          placeholder="18"
                          onBlur={field.handleBlur}
                        />
                        <NumberFieldIncrement aria-label="增加" />
                      </NumberFieldGroup>
                    </NumberField>
                    <FieldDescription>
                      NumberField 的值原生是 number | null,无需字符串转换。
                    </FieldDescription>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="bio">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>简介（可选）</FieldLabel>
                    <Textarea
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      placeholder="唱过什么、想唱什么……"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>可以留空,最多 100 字。</FieldDescription>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>排练偏好</FieldLegend>
          <FieldGroup>
            <form.Field name="voicePart">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field orientation="responsive" data-invalid={invalid || undefined}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>声部</FieldLabel>
                      <FieldError id={errorId} errors={fieldErrors(field)} />
                    </FieldContent>
                    <Select
                      items={VOICE_PARTS}
                      name={field.name}
                      value={field.state.value || null}
                      onValueChange={value => field.handleChange(value ?? '')}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-describedby={errorId}
                        aria-invalid={invalid}
                        className="min-inline-[120px]"
                      >
                        <SelectValue placeholder="选一个声部" />
                      </SelectTrigger>
                      <SelectPopup>
                        <SelectGroup>
                          {Object.entries(VOICE_PARTS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectPopup>
                    </Select>
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="experience">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend id="experience-legend" variant="label" required={REQUIRED.has(field.name)}>
                      经验水平
                    </FieldLegend>
                    <RadioGroup
                      aria-labelledby="experience-legend"
                      name={field.name}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(String(value))}
                    >
                      {EXPERIENCE_LEVELS.map(level => (
                        <Field key={level.id} orientation="horizontal">
                          <RadioGroupItem
                            id={`experience-${level.id}`}
                            value={level.id}
                            aria-describedby={errorId}
                            aria-invalid={invalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={`experience-${level.id}`}>
                              {level.title}
                            </FieldLabel>
                            <FieldDescription>{level.description}</FieldDescription>
                          </FieldContent>
                        </Field>
                      ))}
                    </RadioGroup>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </FieldSet>
                )
              }}
            </form.Field>
            <form.Field name="weekdays" mode="array">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend variant="label" required={REQUIRED.has(field.name)}>排练时段</FieldLegend>
                    <FieldDescription>可多选。</FieldDescription>
                    <FieldGroup>
                      {WEEKDAYS.map(day => (
                        <Field key={day.id} orientation="horizontal">
                          <Checkbox
                            id={`weekdays-${day.id}`}
                            name={field.name}
                            checked={field.state.value.includes(day.id)}
                            aria-describedby={errorId}
                            aria-invalid={invalid}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.pushValue(day.id)
                                return
                              }
                              const index = field.state.value.indexOf(day.id)
                              if (index > -1)
                                void field.removeValue(index)
                            }}
                          />
                          <FieldLabel htmlFor={`weekdays-${day.id}`}>
                            {day.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </FieldSet>
                )
              }}
            </form.Field>
            <form.Field name="weeklyHours">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldTitle id="weekly-hours-label" required={REQUIRED.has(field.name)}>
                      每周可投入（
                      {field.state.value}
                      {' '}
                      小时）
                    </FieldTitle>
                    <Slider
                      aria-labelledby="weekly-hours-label"
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      max={20}
                      name={field.name}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    />
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="notifications">
              {field => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>排练提醒</FieldLabel>
                    <FieldDescription>
                      无校验的字段:排期变化时发邮件提醒。
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <form.Field name="agreeTerms">
          {(field) => {
            const { errorId, invalid } = fieldInvalidState(field)
            return (
              <Field orientation="horizontal" data-invalid={invalid || undefined}>
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  aria-describedby={errorId}
                  aria-invalid={invalid}
                  onCheckedChange={checked => field.handleChange(checked)}
                />
                <FieldContent>
                  <FieldLabel htmlFor={field.name} required={REQUIRED.has(field.name)}>同意排练守则</FieldLabel>
                  <FieldDescription>准时出勤，请假提前一天说。</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit" pending={submitting}>报名</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            重置
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
