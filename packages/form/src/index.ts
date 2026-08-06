import type { AnyFieldApi, AnyFormApi, UpdateMetaOptions } from '@tanstack/react-form'
import type { ComponentType, SyntheticEvent } from 'react'
import {
  createFormHookContexts,
  createFormHook as createTanstackFormHook,
  useStore,
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

export function fieldShouldShowError(field: AnyFieldApi): boolean {
  return field.state.meta.isBlurred || field.form.state.submissionAttempts > 0
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

export function formSubmitHandler(
  handleSubmit: () => Promise<void> | void,
  { focusFirstError = true }: FormSubmitHandlerOptions = {},
): (event: SyntheticEvent<HTMLFormElement>) => void {
  return (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const form = event.currentTarget

    void Promise.resolve(handleSubmit()).finally(() => {
      if (focusFirstError) {
        focusFirstInvalidControl(form)
      }
    })
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
  return useStore(form.store, state => state.isSubmitting)
}
