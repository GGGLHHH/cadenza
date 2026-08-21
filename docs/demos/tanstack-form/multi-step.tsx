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

// The stepped version of the complex form: one useForm spans all five
// steps, values live in the form store and survive step changes.
// "Next" = a submit attempt for the current step (run validation → check
// only this step's fields → on error open the gate and focus). After
// local validation passes, a 200-500ms async confirmation follows —
// one advancing state takes effect in three places: button pending
// (swallows the second hit of a fast double-click), Stepper loading (the
// current step turns into a Spinner), and trigger/back locked together.
// The double-click guard is not decoration: "Next" and "Submit" render in
// the same spot, so the instant advancing completes, a second click would
// land on "Submit" — without pending, the form gets submitted by mistake
const VOICE_PARTS = {
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Tenor',
  bass: 'Bass',
} as const

const EXPERIENCE_LEVELS = [
  { id: 'beginner', title: 'Beginner', description: 'No choir experience, willing to learn from scratch.' },
  { id: 'experienced', title: 'Experienced', description: 'Has sung in a choir or had vocal training.' },
] as const

const WEEKDAYS = [
  { id: 'wed', label: 'Wednesday evening' },
  { id: 'sat', label: 'Saturday afternoon' },
  { id: 'sun', label: 'Sunday afternoon' },
] as const

const schema = z
  .object({
    email: z.email('Enter a valid email address'),
    smsCode: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    age: z
      .number({ error: 'Enter a number' })
      .int('Age must be an integer')
      .min(12, 'Must be at least 12')
      .max(90, 'Must be at most 90')
      .nullable()
      .refine(value => value !== null, 'Enter your age'),
    bio: z.string().max(100, 'Bio must be at most 100 characters'),
    voicePart: z.string().min(1, 'Select a voice part'),
    composerId: z.string().nullable().refine(value => value !== null, 'Select a composer'),
    experience: z.string().min(1, 'Select an experience level'),
    weekdays: z.array(z.string()).min(1, 'Pick at least one rehearsal slot'),
    weeklyHours: z.number().min(2, 'Commit at least 2 hours per week'),
    notifications: z.boolean(),
    agreeTerms: z.boolean().refine(value => value, 'Agree to the rehearsal rules before joining'),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
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

// Fields each step must pass; agreeTerms sits on the last step, gated by
// the real submit pipeline
const STEP_FIELDS = [
  ['email', 'smsCode', 'password', 'confirmPassword'],
  ['fullName', 'age', 'bio'],
  ['voicePart', 'composerId', 'experience'],
  ['weekdays', 'weeklyHours'],
] as const

// The same page also renders the complex-form demo with identical field
// names, and fieldControlProps uses field.name as the DOM id — used bare
// it would collide into duplicate ids, and htmlFor / aria-describedby
// would both resolve to the document's first match (the complex form's
// control), so clicking a label jumps to the wrong form. Every id this
// demo puts in the DOM gets an ms- prefix; name (form serialization)
// stays untouched
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
      // validators only validate, never transform: transform output must
      // be obtained by parsing at submit time
      const data = schema.parse(value)
      toast('Submitted the following:', {
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
    // The pending button already swallows repeat clicks; this is the
    // fallback for keyboard and other entry points
    if (advancing || submitting)
      return
    // Untouched fields have no validation record yet, so force one
    // change-validation pass first
    await form.validate('change')
    const invalid = (STEP_FIELDS[step - 1] ?? []).filter(
      name => (form.getFieldMeta(name)?.errors.length ?? 0) > 0,
    )
    if (invalid.length > 0) {
      // "Trying to advance" is this step's submit attempt: mark
      // dirty+blurred so the gate opens only for these fields
      for (const name of invalid)
        form.setFieldMeta(name, meta => ({ ...meta, isBlurred: true, isDirty: true }))
      if (formRef.current)
        focusFirstInvalidControl(formRef.current)
      return
    }
    // Only after local validation passes does the async confirmation go
    // out (simulating per-step server persistence); the whole navigation
    // surface locks meanwhile
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
          // Going back is free; advancing always goes through "Next";
          // everything locks during the async confirmation
          if (advancing || submitting || next > step) {
            details.cancel()
            return
          }
          setStep(next)
        }}
      />
      {step === 1 && (
        <FieldSet>
          <FieldLegend>Account</FieldLegend>
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>Email</FieldLabel>
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
                    <FieldLabel htmlFor={msId(field.name)}>SMS verification code</FieldLabel>
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
                    <FieldLabel htmlFor={msId(field.name)}>Password</FieldLabel>
                    <Input
                      {...msControlProps(field)}
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>At least 8 characters.</FieldDescription>
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
                    <FieldLabel htmlFor={msId(field.name)}>Confirm password</FieldLabel>
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
          <FieldLegend>Profile</FieldLegend>
          <FieldGroup>
            <form.Field name="fullName">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={msId(field.name)}>Name</FieldLabel>
                    <Input
                      {...msControlProps(field)}
                      value={field.state.value}
                      autoComplete="name"
                      placeholder="Alex Carter"
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
                    <FieldLabel htmlFor={msId(field.name)}>Age</FieldLabel>
                    <NumberField
                      id={msId(field.name)}
                      name={field.name}
                      min={12}
                      max={90}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement aria-label="Decrease" />
                        <NumberFieldInput
                          aria-describedby={msErrorId(field.name)}
                          aria-invalid={invalid}
                          aria-required
                          placeholder="18"
                          onBlur={field.handleBlur}
                        />
                        <NumberFieldIncrement aria-label="Increase" />
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
                    <FieldLabel htmlFor={msId(field.name)}>Bio (optional)</FieldLabel>
                    <Textarea
                      {...msControlProps(field)}
                      value={field.state.value}
                      placeholder="What you have sung, what you want to sing…"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>May be left empty; at most 100 characters.</FieldDescription>
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
          <FieldLegend>Rehearsal preferences</FieldLegend>
          <FieldGroup>
            <form.Field name="voicePart">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <Field orientation="responsive" data-invalid={invalid || undefined}>
                    <FieldContent>
                      <FieldLabel htmlFor={msId(field.name)}>Voice part</FieldLabel>
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
                        className="min-inline-30"
                      >
                        <SelectValue placeholder="Pick a voice part" />
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
                      Favorite composer
                    </FieldLabel>
                    <InfiniteCombobox<Person>
                      getOption={getOption}
                      list={composerList}
                      name={field.name}
                      searchPlaceholder="Search composers…"
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
                        {pickedComposer ? pickedComposer.name : 'Select a composer'}
                      </DemoButton>
                      {selectSlots}
                      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
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
                      Experience level
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
          <FieldLegend>Schedule</FieldLegend>
          <FieldGroup>
            <form.Field name="weekdays" mode="array">
              {(field) => {
                const { invalid } = fieldInvalidState(field)
                return (
                  <FieldSet data-invalid={invalid || undefined}>
                    <FieldLegend variant="label" required>Rehearsal slots</FieldLegend>
                    <FieldDescription>Multiple choices allowed.</FieldDescription>
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
                      Weekly commitment (
                      {field.state.value}
                      {' '}
                      hours)
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
                    <FieldLabel htmlFor={msId(field.name)}>Rehearsal reminders</FieldLabel>
                    <FieldDescription>Email me when the schedule changes.</FieldDescription>
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
          <FieldLegend>Review and submit</FieldLegend>
          <FieldGroup>
            {/* Only agreeTerms is editable on this step; the summary values
                cannot change while shown, so read form.state.values directly */}
            <dl className="
              grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm
            "
            >
              <dt className="text-muted-foreground">Name</dt>
              <dd>{values.fullName}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{values.email}</dd>
              <dt className="text-muted-foreground">Age</dt>
              <dd>{values.age}</dd>
              <dt className="text-muted-foreground">Voice part</dt>
              <dd>{VOICE_PARTS[values.voicePart as keyof typeof VOICE_PARTS] ?? '—'}</dd>
              <dt className="text-muted-foreground">Composer</dt>
              <dd>{pickedComposer?.name ?? '—'}</dd>
              <dt className="text-muted-foreground">Experience</dt>
              <dd>{EXPERIENCE_LEVELS.find(level => level.id === values.experience)?.title ?? '—'}</dd>
              <dt className="text-muted-foreground">Rehearsal slots</dt>
              <dd>{WEEKDAYS.filter(day => values.weekdays.includes(day.id)).map(day => day.label).join(', ')}</dd>
              <dt className="text-muted-foreground">Weekly commitment</dt>
              <dd>
                {values.weeklyHours}
                {' '}
                hours, reminders
                {' '}
                {values.notifications ? 'on' : 'off'}
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
                      <FieldLabel htmlFor={msId(field.name)}>Agree to the rehearsal rules</FieldLabel>
                      <FieldDescription>Show up on time; ask for leave a day ahead.</FieldDescription>
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
          Back
        </Button>
        {step < 5
          ? (
              <Button pending={advancing} type="button" onClick={() => void handleNext()}>
                Next
              </Button>
            )
          : (
              <Button pending={submitting} type="submit">
                Sign up
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
          Reset
        </Button>
      </Field>
    </form>
  )
}
