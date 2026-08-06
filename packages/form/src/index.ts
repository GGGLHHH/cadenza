import type { AnyFieldApi, AnyFormApi, UpdateMetaOptions } from '@tanstack/react-form'
import type { ComponentType, SyntheticEvent } from 'react'
import {
  createFormHookContexts,
  createFormHook as createTanstackFormHook,
  useSelector,
} from '@tanstack/react-form'
import { useEffect } from 'react'

export * from '@tanstack/react-form'

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

export { useFieldContext, useFormContext }

export interface FormFieldError { message?: string }

export interface AppFieldControlProps {
  'aria-describedby': string
  'aria-invalid': boolean
  'id': string
  'name': string
}

export const silentFieldUpdateOptions: UpdateMetaOptions = {
  dontRunListeners: true,
  dontUpdateMeta: true,
  dontValidate: true,
}

export const validatingFieldUpdateOptions: UpdateMetaOptions = {
  dontRunListeners: true,
}

export function fieldErrors(field: AnyFieldApi): FormFieldError[] {
  if (!fieldShouldShowError(field)) {
    return []
  }

  return normalizeFieldErrors(field.state.meta.errors)
}

export function fieldHasError(field: AnyFieldApi): boolean {
  return fieldErrors(field).length > 0
}

export function fieldErrorMessage(field: AnyFieldApi): string | undefined {
  return fieldErrors(field)[0]?.message
}

// 只骂动过的字段:整表 onChange 校验会给未碰过的字段写入错误,dirty 条件挡住
// 「点按钮夺焦/结构性操作触发校验」这类误伤;dirty 是粘性的(输入过再清空仍算动过)。
// 提交过则全部放行 —— revealFieldErrors 的 isBlurred 写入只作重渲染载体
export function fieldShouldShowError(field: AnyFieldApi): boolean {
  return (
    (field.state.meta.isDirty && field.state.meta.isBlurred)
    || field.form.state.submissionAttempts > 0
  )
}

export function fieldErrorId(fieldName: string): string {
  return `${fieldName.replaceAll(/[^\w-]/g, '-')}-error`
}

export function fieldInvalidState(field: AnyFieldApi): {
  errorId: string
  invalid: boolean
} {
  return {
    errorId: fieldErrorId(field.name as string),
    invalid: fieldHasError(field),
  }
}

export function fieldControlProps(field: AnyFieldApi): AppFieldControlProps {
  const { errorId, invalid } = fieldInvalidState(field)

  return {
    'id': field.name as string,
    'name': field.name as string,
    'aria-describedby': errorId,
    'aria-invalid': invalid,
  }
}

export function normalizeFieldErrors(errors: unknown[]): FormFieldError[] {
  return errors.flatMap((error) => {
    if (Array.isArray(error)) {
      return normalizeFieldErrors(error)
    }

    if (typeof error === 'string') {
      return [{ message: error }]
    }

    if (isErrorWithMessage(error)) {
      return [{ message: error.message }]
    }

    return []
  })
}

function isErrorWithMessage(error: unknown): error is FormFieldError {
  return (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof (error as FormFieldError).message === 'string'
  )
}

interface FormSubmitHandlerOptions {
  focusFirstError?: boolean
}

const INVALID_FORM_CONTROL_SELECTOR
  = '[aria-invalid="true"]:not(:disabled):not([aria-disabled="true"])'

// 提交过的表单处于实时纠错模式,但新字段(数组加行)的登记晚于最近一次校验分发,
// meta 落后于真相且无人再触发校验 —— 监听 fieldMeta 键集,新键出现即补跑一次
// change 校验。WeakSet 保证每个 form 实例只挂一次订阅,订阅随 form 一同回收
const lateFieldValidationForms = new WeakSet<AnyFormApi>()

function ensureLateFieldValidation(form: AnyFormApi): void {
  if (lateFieldValidationForms.has(form)) {
    return
  }
  lateFieldValidationForms.add(form)

  let knownFields = new Set(Object.keys(form.state.fieldMeta))
  form.store.subscribe(() => {
    const fields = Object.keys(form.state.fieldMeta)
    const hasNewField = fields.some(name => !knownFields.has(name))
    knownFields = new Set(fields)

    if (hasNewField && form.state.submissionAttempts > 0) {
      queueMicrotask(() => {
        void form.validate('change')
      })
    }
  })
}

export function formSubmitHandler(
  form: AnyFormApi | (() => Promise<void> | void),
  { focusFirstError = true }: FormSubmitHandlerOptions = {},
): (event: SyntheticEvent<HTMLFormElement>) => void {
  const formApi = typeof form === 'function' ? undefined : form
  const handleSubmit = typeof form === 'function' ? form : () => form.handleSubmit()

  if (formApi !== undefined) {
    ensureLateFieldValidation(formApi)
  }

  return (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const formElement = event.currentTarget

    void Promise.resolve(handleSubmit())
      .then(async () => {
        // handleSubmit 在字段级校验失败时会整体跳过表单级校验(form-core 行为),
        // 新注册、尚未被校验过的字段因此拿不到错误 —— 失败提交后补跑一次完整校验
        if (formApi !== undefined && !formApi.state.isValid) {
          await formApi.validate('submit')
        }
      })
      .finally(() => {
        if (formApi !== undefined) {
          revealFieldErrors(formApi)
        }

        if (focusFirstError) {
          focusFirstInvalidControl(formElement)
        }
      })
  }
}

// 提交后把「有错误但未 blur」的字段标记为已 blur:错误展示门禁只依赖字段本地
// 状态就能打开 —— submissionAttempts 住在表单 store 里,字段组件不订阅它,
// 已 touched 的错误字段在提交时可能没有任何字段级写入、不会重渲染
// <form {...formProps(form)}>:noValidate + 提交管线一次接齐。noValidate 统一在
// 这里给 —— 原生约束校验(type="email"/required/pattern)会在 submit 事件派发之前
// 拦截提交并弹原生气泡,门面提交管线完全不运行;schema 是唯一校验真源
export function formProps(
  form: AnyFormApi,
  options?: FormSubmitHandlerOptions,
): { noValidate: true, onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void } {
  return {
    noValidate: true,
    onSubmit: formSubmitHandler(form, options),
  }
}

export function revealFieldErrors(form: AnyFormApi): void {
  for (const [name, meta] of Object.entries(form.state.fieldMeta)) {
    if (meta !== undefined && meta.errors.length > 0 && !meta.isBlurred) {
      form.setFieldMeta(name, previous => ({ ...previous, isBlurred: true }))
    }
  }
}

export function focusFirstInvalidControl(form: HTMLFormElement): void {
  const schedule = window.requestAnimationFrame?.bind(window) ?? window.setTimeout.bind(window)

  schedule(() => {
    if (!form.isConnected) {
      return
    }

    const invalidControl = form.querySelector<HTMLElement>(INVALID_FORM_CONTROL_SELECTOR)
    invalidControl?.focus()
  })
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createFormHook<
  FieldComponents extends Record<string, ComponentType<any>> = Record<string, never>,
  FormComponents extends Record<string, ComponentType<any>> = Record<string, never>,
>(options: {
  fieldComponents?: FieldComponents
  formComponents?: FormComponents
} = {}) {
  return createTanstackFormHook({
    fieldComponents: options.fieldComponents ?? ({} as FieldComponents),
    formComponents: options.formComponents ?? ({} as FormComponents),
    fieldContext,
    formContext,
  })
}

export function useFormReset<TFormData>(
  form: { reset: (values?: TFormData) => void },
  defaultValues: TFormData,
): void {
  useEffect(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])
}

export function useFormSubmitting(form: AnyFormApi): boolean {
  return useSelector(form.store, state => state.isSubmitting)
}
