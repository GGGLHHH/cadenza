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

// Kitchen-sink example: the whole control family x common zod shapes —
// required/email/number coerce/cross-field superRefine/optional length
// cap/array min/boolean refine/slider range, all through one facade wiring
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

export default function ComplexDemo(): ReactElement {
  const comboboxState = useInfiniteComboboxState()
  const composerList = useFakeInfiniteList(comboboxState.queryValue)
  const [pickedComposer, setPickedComposer] = useState<Person | null>(null)
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: schema },
    onSubmit: async ({ formApi, value }) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      // validators only validate, never transform: transform output (age
      // as a number) must be obtained by parsing at submit time
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
          <FieldLegend>Account</FieldLegend>
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
                    <FieldLabel htmlFor={field.name}>SMS verification code</FieldLabel>
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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      autoComplete="new-password"
                      type="password"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>At least 8 characters.</FieldDescription>
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
                    <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
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
          <FieldLegend>Profile</FieldLegend>
          <FieldGroup>
            <form.Field name="fullName">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      autoComplete="name"
                      placeholder="Alex Carter"
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
                    <FieldLabel htmlFor={field.name}>Age</FieldLabel>
                    <NumberField
                      id={field.name}
                      name={field.name}
                      min={12}
                      max={90}
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value)}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement aria-label="Decrease" />
                        <NumberFieldInput
                          aria-describedby={errorId}
                          aria-invalid={invalid}
                          aria-required
                          placeholder="18"
                          onBlur={field.handleBlur}
                        />
                        <NumberFieldIncrement aria-label="Increase" />
                      </NumberFieldGroup>
                    </NumberField>
                    <FieldDescription>
                      NumberField values are natively number | null — no
                      string conversion needed.
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
                    <FieldLabel htmlFor={field.name}>Bio (optional)</FieldLabel>
                    <Textarea
                      {...fieldControlProps(field)}
                      value={field.state.value}
                      placeholder="What you have sung, what you want to sing…"
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>May be left empty; at most 100 characters.</FieldDescription>
                    <FieldError id={errorId} errors={fieldErrors(field)} />
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>Rehearsal preferences</FieldLegend>
          <FieldGroup>
            <form.Field name="voicePart">
              {(field) => {
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field orientation="responsive" data-invalid={invalid || undefined}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Voice part</FieldLabel>
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
                const { errorId, invalid } = fieldInvalidState(field)
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor="signup-composer-trigger" required>
                      Favorite composer
                    </FieldLabel>
                    <InfiniteCombobox<Person>
                      getOption={getOption}
                      list={composerList}
                      name={field.name}
                      searchPlaceholder="Search composers…"
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
                        {pickedComposer ? pickedComposer.name : 'Select a composer'}
                      </DemoButton>
                      {selectSlots}
                      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
                    </InfiniteCombobox>
                    <FieldDescription>The form persists the id, not the object.</FieldDescription>
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
                      Experience level
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
                    <FieldLegend variant="label" required>Rehearsal slots</FieldLegend>
                    <FieldDescription>Multiple choices allowed.</FieldDescription>
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
                      Weekly commitment (
                      {field.state.value}
                      {' '}
                      hours)
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
                    <FieldLabel htmlFor={field.name}>Rehearsal reminders</FieldLabel>
                    <FieldDescription>
                      A field with no validation: email me when the
                      schedule changes.
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
                  <FieldLabel htmlFor={field.name}>Agree to the rehearsal rules</FieldLabel>
                  <FieldDescription>Show up on time; ask for leave a day ahead.</FieldDescription>
                  <FieldError id={errorId} errors={fieldErrors(field)} />
                </FieldContent>
              </Field>
            )
          }}
        </form.Field>
        <Field orientation="horizontal">
          <Button type="submit" pending={submitting}>Sign up</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
