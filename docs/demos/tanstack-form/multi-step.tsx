import type { AnyFieldApi, AppFieldControlProps } from '@gedatou/cadenza-form'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  fieldControlProps,
  fieldErrors,
  fieldInvalidState,
  focusFirstInvalidControl,
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
  Stepper,
  Switch,
  Textarea,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { IconMail } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { selectSlots } from '../infinite-select/slots'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// 复杂表单的分步版:一个 useForm 贯穿五步,值住在 form store,切步不丢。
// 「下一步」= 本步的提交尝试(补跑校验 → 只查本步字段 → 有错开门禁并聚焦),
// 过了本地校验再走一段 200–500ms 的异步确认 —— advancing 一个状态三处生效:
// 按钮 pending(吞掉快速双击的第二击)、Stepper loading(当前步转 Spinner)、
// trigger/上一步一并锁定。防双击不是装饰:「下一步」与「提交」渲染在同一位置,
// 推进完成的瞬间第二击会落在「提交」上,没有 pending 拦着表单就被误交了
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

// 每步要过的校验;agreeTerms 在最后一步,由真提交的管线把关
const STEP_FIELDS = [
  ['email', 'smsCode', 'password', 'confirmPassword'],
  ['fullName', 'age', 'bio'],
  ['voicePart', 'composerId', 'experience'],
  ['weekdays', 'weeklyHours'],
] as const

// 同一页还渲染着复杂表单 demo,字段名完全相同,而 fieldControlProps 用 field.name
// 当 DOM id —— 裸用会撞出重复 id,htmlFor / aria-describedby 都解析到文档里第一个
// 匹配(复杂表单的控件),label 一点就跳错表单。本 demo 落 DOM 的 id 一律加 ms-
// 前缀;name(表单序列化用)不动
function msId(name: string): string {
  return `ms-${name}`
}
function msErrorId(name: string): string {
  return `ms-${name}-error`
}
function msControlProps(field: AnyFieldApi): AppFieldControlProps {
  return {
    ...fieldControlProps(field),
    'id': msId(field.name as string),
    'aria-describedby': msErrorId(field.name as string),
  }
}

export default function MultiStepDemo(): ReactElement {
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(1)
  const [advancing, setAdvancing] = useState(false)
  const comboboxState = useInfiniteComboboxState()
  const composerList = useFakeInfiniteList(comboboxState.queryValue)
  const [pickedComposer, setPickedComposer] = useState<Person | null>(null)
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: schema },
    onSubmit: async ({ formApi, value }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      // validators 只校验不转换:transform 的产物要在提交时 parse 拿到
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
      setStep(1)
    },
  })
  const submitting = useFormSubmitting(form)

  const handleNext = async (): Promise<void> => {
    // pending 的按钮已经吞掉重复点击,这里是键盘等其他入口的兜底
    if (advancing || submitting)
      return
    // 没动过的字段此前没有任何校验记录,先强制跑一遍 change 校验
    await form.validate('change')
    const invalid = (STEP_FIELDS[step - 1] ?? []).filter(
      name => (form.getFieldMeta(name)?.errors.length ?? 0) > 0,
    )
    if (invalid.length > 0) {
      // 「试图前进」就是本步的提交尝试:标记 dirty+blurred,门禁只对这些字段打开
      for (const name of invalid)
        form.setFieldMeta(name, meta => ({ ...meta, isBlurred: true, isDirty: true }))
      if (formRef.current)
        focusFirstInvalidControl(formRef.current)
      return
    }
    // 本地校验过了才发异步确认(模拟服务端逐步落库),期间整个导航面锁定
    setAdvancing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
      setStep(current => current + 1)
    }
    finally {
      setAdvancing(false)
    }
  }

  const values = form.state.values

  return (
    <form
      {...formProps(form)}
      className="mx-auto flex flex-col gap-8 inline-full max-inline-sm"
      ref={formRef}
    >
      <Stepper
        loading={advancing}
        steps={5}
        value={step}
        onValueChange={(next, details) => {
          // 回头随便点;前进一律走「下一步」;异步确认期间整面锁定
          if (advancing || submitting || next > step) {
            details.cancel()
            return
          }
          setStep(next)
        }}
      />
      {step === 1 && (
        <FieldSet>
          <FieldLegend>账号</FieldLegend>
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>邮箱</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <IconMail aria-hidden />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...msControlProps(field)}
                        value={field.state.value}
                        autoComplete="email"
                        placeholder="name@example.com"
                        type="email"
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                      />
                    </InputGroup>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="smsCode">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>短信验证码</FieldLabel>
                    <InputOTP
                      {...msControlProps(field)}
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
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>密码</FieldLabel>
                    <Input
                      {...msControlProps(field)}
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>至少 8 位。</FieldDescription>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>确认密码</FieldLabel>
                    <Input
                      {...msControlProps(field)}
                      aria-required
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      )}
      {step === 2 && (
        <FieldSet>
          <FieldLegend>基本资料</FieldLegend>
          <FieldGroup>
            <form.Field name="fullName">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>姓名</FieldLabel>
                    <Input
                      {...msControlProps(field)}
                      value={field.state.value}
                      autoComplete="name"
                      placeholder="葛大头"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="age">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>年龄</FieldLabel>
                    <NumberField
                      id={msId(field.name)}
                      name={field.name}
                      min={12}
                      max={90}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement aria-label="减少" />
                        <NumberFieldInput
                          aria-describedby={msErrorId(field.name)}
                          aria-invalid={invalid}
                          aria-required
                          placeholder="18"
                          onBlur={field.handleBlur}
                        />
                        <NumberFieldIncrement aria-label="增加" />
                      </NumberFieldGroup>
                    </NumberField>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="bio">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>简介（可选）</FieldLabel>
                    <Textarea
                      {...msControlProps(field)}
                      value={field.state.value}
                      placeholder="唱过什么、想唱什么……"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>可以留空,最多 100 字。</FieldDescription>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      )}
      {step === 3 && (
        <FieldSet>
          <FieldLegend>排练偏好</FieldLegend>
          <FieldGroup>
            <form.Field name="voicePart">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field orientation="responsive" data-invalid={invalid || undefined}>
                    <FieldContent>
                      <FieldLabel htmlFor={msId(field.name)}>声部</FieldLabel>
                      <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                    </FieldContent>
                    <Select
                      items={VOICE_PARTS}
                      name={field.name}
                      value={field.state.value || null}
                      onValueChange={value => field.handleChange(value ?? '')}
                    >
                      <SelectTrigger
                        id={msId(field.name)}
                        aria-describedby={msErrorId(field.name)}
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
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor="ms-composer-trigger" required>
                      最喜欢的作曲家
                    </FieldLabel>
                    <InfiniteCombobox<Person>
                      getOption={getOption}
                      list={composerList}
                      name={field.name}
                      searchPlaceholder="搜索作曲家…"
                      state={comboboxState}
                      triggerId="ms-composer-trigger"
                      value={field.state.value}
                      onValueChange={(item) => {
                        setPickedComposer(item)
                        field.handleChange(item?.id ?? null)
                      }}
                    >
                      <DemoButton
                        aria-describedby={msErrorId(field.name)}
                        aria-invalid={invalid}
                        className="justify-start inline-full"
                      >
                        {pickedComposer ? pickedComposer.name : '选择作曲家'}
                      </DemoButton>
                      {selectSlots}
                      <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
                    </InfiniteCombobox>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="experience">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend id="ms-experience-legend" variant="label">
                      经验水平
                    </FieldLegend>
                    <RadioGroup
                      aria-labelledby="ms-experience-legend"
                      aria-required
                      name={field.name}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(String(value))}
                    >
                      {EXPERIENCE_LEVELS.map(level => (
                        <Field key={level.id} orientation="horizontal">
                          <RadioGroupItem
                            id={`ms-experience-${level.id}`}
                            value={level.id}
                            aria-describedby={msErrorId(field.name)}
                            aria-invalid={invalid}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={`ms-experience-${level.id}`}>
                              {level.title}
                            </FieldLabel>
                            <FieldDescription>{level.description}</FieldDescription>
                          </FieldContent>
                        </Field>
                      ))}
                    </RadioGroup>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </FieldSet>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      )}
      {step === 4 && (
        <FieldSet>
          <FieldLegend>时间安排</FieldLegend>
          <FieldGroup>
            <form.Field name="weekdays" mode="array">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend variant="label" required>排练时段</FieldLegend>
                    <FieldDescription>可多选。</FieldDescription>
                    <FieldGroup>
                      {WEEKDAYS.map(day => (
                        <Field key={day.id} orientation="horizontal">
                          <Checkbox
                            id={`ms-weekdays-${day.id}`}
                            name={field.name}
                            checked={field.state.value.includes(day.id)}
                            aria-describedby={msErrorId(field.name)}
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
                          <FieldLabel htmlFor={`ms-weekdays-${day.id}`}>
                            {day.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </FieldSet>
                )
              }}
            </form.Field>
            <form.Field name="weeklyHours">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldTitle id="ms-weekly-hours-label">
                      每周可投入（
                      {field.state.value}
                      {' '}
                      小时）
                    </FieldTitle>
                    <Slider
                      aria-labelledby="ms-weekly-hours-label"
                      aria-describedby={msErrorId(field.name)}
                      aria-invalid={invalid}
                      aria-required
                      max={20}
                      name={field.name}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    />
                    <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="notifications">
              {field => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={msId(field.name)}>排练提醒</FieldLabel>
                    <FieldDescription>排期变化时发邮件提醒。</FieldDescription>
                  </FieldContent>
                  <Switch
                    id={msId(field.name)}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      )}
      {step === 5 && (
        <FieldSet>
          <FieldLegend>确认提交</FieldLegend>
          <FieldGroup>
            {/* 本步只有 agreeTerms 可编辑,摘要值不会在展示期间变化,直接读 form.state.values */}
            <dl className="
              grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm
            "
            >
              <dt className="text-muted-foreground">姓名</dt>
              <dd>{values.fullName}</dd>
              <dt className="text-muted-foreground">邮箱</dt>
              <dd>{values.email}</dd>
              <dt className="text-muted-foreground">年龄</dt>
              <dd>{values.age}</dd>
              <dt className="text-muted-foreground">声部</dt>
              <dd>{VOICE_PARTS[values.voicePart as keyof typeof VOICE_PARTS] ?? '—'}</dd>
              <dt className="text-muted-foreground">作曲家</dt>
              <dd>{pickedComposer?.name ?? '—'}</dd>
              <dt className="text-muted-foreground">经验</dt>
              <dd>{EXPERIENCE_LEVELS.find(level => level.id === values.experience)?.title ?? '—'}</dd>
              <dt className="text-muted-foreground">排练时段</dt>
              <dd>{WEEKDAYS.filter(day => values.weekdays.includes(day.id)).map(day => day.label).join('、')}</dd>
              <dt className="text-muted-foreground">每周投入</dt>
              <dd>
                {values.weeklyHours}
                {' '}
                小时,提醒
                {values.notifications ? '开' : '关'}
              </dd>
            </dl>
            <form.Field name="agreeTerms">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field orientation="horizontal" data-invalid={invalid || undefined}>
                    <Checkbox
                      id={msId(field.name)}
                      name={field.name}
                      checked={field.state.value}
                      aria-describedby={msErrorId(field.name)}
                      aria-invalid={invalid}
                      aria-required
                      onCheckedChange={checked => field.handleChange(checked)}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={msId(field.name)}>同意排练守则</FieldLabel>
                      <FieldDescription>准时出勤，请假提前一天说。</FieldDescription>
                      <FieldError id={msErrorId(field.name)} errors={fieldErrors(field)} />
                    </FieldContent>
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
      )}
      <Field orientation="horizontal">
        <Button
          disabled={step === 1 || advancing || submitting}
          type="button"
          variant="outline"
          onClick={() => setStep(current => current - 1)}
        >
          上一步
        </Button>
        {step < 5
          ? (
              <Button pending={advancing} type="button" onClick={() => void handleNext()}>
                下一步
              </Button>
            )
          : (
              <Button pending={submitting} type="submit">
                报名
              </Button>
            )}
        <Button
          disabled={advancing || submitting}
          type="button"
          variant="outline"
          onClick={() => {
            form.reset()
            setPickedComposer(null)
            setStep(1)
          }}
        >
          重置
        </Button>
      </Field>
    </form>
  )
}
