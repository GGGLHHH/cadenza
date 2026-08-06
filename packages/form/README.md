# @gedatou/cadenza-form

TanStack Form 的门面薄封装：API 与 `@tanstack/react-form` 完全一致（全量转发），
另附一组表单惯例默认能力。只需安装本包，不需要再装 `@tanstack/react-form`。

## 用法

```tsx
import {
  createFormHook,
  fieldControlProps,
  fieldErrors,
  formProps,
  useFieldContext,
} from '@gedatou/cadenza-form'

function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  return (
    <label>
      {label}
      <input
        {...fieldControlProps(field)}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
      {fieldErrors(field).map(error => <span key={error.message}>{error.message}</span>)}
    </label>
  )
}

const { useAppForm } = createFormHook({ fieldComponents: { TextField } })

function Demo() {
  const form = useAppForm({
    defaultValues: { name: '' },
    validators: { onChange: schema },
    onSubmit: ({ value }) => save(value),
  })
  return (
    <form {...formProps(form)}>
      <form.AppField name="name">{field => <field.TextField label="姓名" />}</form.AppField>
    </form>
  )
}
```

## 与官方 API 的差异

- `createFormHook(options?)`：contexts 由包内单例自动注入，`fieldComponents`/`formComponents`
  可省略；需要自定义 contexts 时直接使用 `@tanstack/react-form`。
- 其余导出与官方一致，另加：
  - `formProps(form)` / `formSubmitHandler(form)` / `revealFieldErrors` /
    `focusFirstInvalidControl`：noValidate + preventDefault + 失败后补跑完整校验 +
    提交后把错误字段标记为已 blur（驱动门禁展示）+ 聚焦首个
    `[aria-invalid="true"]` 控件。
  - 错误展示门禁族 `fieldErrors` / `fieldErrorMessage` / `fieldShouldShowError` /
    `fieldInvalidState` / `fieldControlProps` / `normalizeFieldErrors`：onChange 实时校验，
    错误信息等字段被改过（dirty）且失焦过、或表单提交过才展示。
  - `silentFieldUpdateOptions` / `validatingFieldUpdateOptions`：程序化 `setFieldValue`
    的两档更新静默级别。
  - `useFormReset(form, defaultValues)` / `useFormSubmitting(form)`：异步默认值回填与
    提交态订阅的样板消除。
