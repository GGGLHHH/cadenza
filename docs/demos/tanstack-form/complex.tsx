import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  formProps,
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
  InfiniteCombobox,
  InfiniteSelectLoadingMore,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
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
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { IconMail } from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

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
    smsCode: z.string().regex(/^\d{6}$/, '请输入 6 位数字验证码'),
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
    composerId: z.string().nullable().refine(value => value !== null, '请选择作曲家'),
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
  smsCode: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  age: null as number | null,
  bio: '',
  voicePart: '',
  composerId: null as string | null,
  experience: '',
  weekdays: [] as string[],
  weeklyHours: 0,
  notifications: true,
  agreeTerms: false,
}

export default function ComplexDemo(): ReactElement {
  const comboboxState = useInfiniteComboboxState()
  const composerList = useFakeInfiniteList(comboboxState.queryValue)
  const [pickedComposer, setPickedComposer] = useState<Person | null>(null)
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
      setPickedComposer(null)
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
                    <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>
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
            <form.Field name="smsCode">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>短信验证码</FieldLabel>
                    <InputOTP
                      {...fieldControlProps(field)}
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
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
                    <FieldLabel htmlFor={field.name}>密码</FieldLabel>
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
                    <FieldLabel htmlFor={field.name}>确认密码</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      aria-required
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
                    <FieldLabel htmlFor={field.name}>姓名</FieldLabel>
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
                    <FieldLabel htmlFor={field.name}>年龄</FieldLabel>
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
                          aria-required
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
                    <FieldLabel htmlFor={field.name}>简介（可选）</FieldLabel>
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
                      <FieldLabel htmlFor={field.name}>声部</FieldLabel>
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
                        aria-required
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
            <form.Field name="composerId">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor="signup-composer-trigger" required>
                      最喜欢的作曲家
                    </FieldLabel>
                    <InfiniteCombobox<Person>
                      getOption={getOption}
                      list={composerList}
                      name={field.name}
                      searchPlaceholder="搜索作曲家…"
                      state={comboboxState}
                      triggerId="signup-composer-trigger"
                      value={field.state.value}
                      onValueChange={(item) => {
                        setPickedComposer(item)
                        field.handleChange(item?.id ?? null)
                      }}
                    >
                      <DemoButton
                        aria-describedby={errorId}
                        aria-invalid={invalid}
                        className="justify-start inline-full"
                      >
                        {pickedComposer ? pickedComposer.name : '选择作曲家'}
                      </DemoButton>
                      {selectSlots}
                      <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
                    </InfiniteCombobox>
                    <FieldDescription>表单持久化的是 id,不是对象。</FieldDescription>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="experience">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend id="experience-legend" variant="label">
                      经验水平
                    </FieldLegend>
                    <RadioGroup
                      aria-labelledby="experience-legend"
                      aria-required
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
                    <FieldLegend variant="label" required>排练时段</FieldLegend>
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
                    <FieldTitle id="weekly-hours-label">
                      每周可投入（
                      {field.state.value}
                      {' '}
                      小时）
                    </FieldTitle>
                    <Slider
                      aria-labelledby="weekly-hours-label"
                      aria-describedby={errorId}
                      aria-invalid={invalid}
                      aria-required
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
                    <FieldLabel htmlFor={field.name}>排练提醒</FieldLabel>
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
                  aria-required
                  onCheckedChange={checked => field.handleChange(checked)}
                />
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>同意排练守则</FieldLabel>
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
