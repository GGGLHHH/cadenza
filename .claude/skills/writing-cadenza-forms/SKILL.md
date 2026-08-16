---
name: writing-cadenza-forms
description: Use when building or reviewing forms with @gedatou/cadenza-form (the TanStack Form facade) and cadenza-ui field controls — wiring useForm + zod schemas to Input/Textarea/NumberField/Select/RadioGroup/Checkbox/Switch/Slider/InputOTP/InfiniteCombobox, deciding when field errors show, aria/label wiring, rendering multiple forms on one page, or building multi-step (stepper) forms.
---

# Writing Cadenza Forms

`@gedatou/cadenza-form` 是 TanStack Form 的门面：aria 接线、错误展示时机、
提交管线都是**包默认**。正确姿势是让门面干活，不是重新发明接线。深读:
`docs/content/docs/forms/tanstack-form.mdx`(569 行全指南)、
`docs/demos/tanstack-form/`(14 个可运行范例,`complex.tsx` 全控件、
`multi-step.tsx` 分步)。**先抄骨架,再查差异表,别逐个 demo 考古。**

## 恒定骨架(每个字段都长这样)

```tsx
const schema = z.object({ title: z.string().min(5, '至少 5 个字') })

const form = useForm({
  defaultValues: { title: '' },
  validators: { onChange: schema },            // 实时校验,展示时机由门禁另管
  onSubmit: async ({ value }) => { /* … */ },
})

<form {...formProps(form)}>                    {/* noValidate + 提交管线,一次接齐 */}
  <form.Field name="title">
    {(field) => {
      const { errorId, invalid } = fieldInvalidState(field)
      return (
        <Field data-invalid={invalid || undefined}>
          <FieldLabel htmlFor={field.name}>标题</FieldLabel>
          <Input
            {...fieldControlProps(field)}      {/* id/name/aria-describedby/aria-invalid/aria-required 五线 */}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={e => field.handleChange(e.target.value)}
          />
          <FieldError id={errorId} errors={fieldErrors(field)} />
        </Field>
      )
    }}
  </form.Field>
  <Button type="submit" pending={useFormSubmitting(form)}>提交</Button>
</form>
```

## 五条铁律

1. **错误只经 `fieldErrors(field)` 读。** 它带门禁(dirty+blurred 或提交过),
   直读 `field.state.meta.errors` 会让没碰过的字段一渲染就挨骂。每个控件都要接
   `onBlur={field.handleBlur}`,否则 blur 门禁永远打不开。
2. **提交只走 `formProps(form)`。** 它给 `noValidate`(原生约束校验会在 submit
   事件前拦截提交,门面管线完全不跑)+ 失败后揭示错误 + 聚焦首个无效控件。
3. **`validators` 只校验不转换。** schema 里有 `.trim()`/`.transform()` 时,
   `onSubmit` 拿到的 `value` 是**原始值**——转换产物必须 `schema.parse(value)` 再用。
4. **同页多表单:包一层,不要弃用展开。** `fieldControlProps` 拿裸 `field.name`
   当 DOM id,同页同名字段会撞 id(label 跳错表单、读屏读错错误)。修法是覆盖
   两键、保留其余三线(`aria-required` 自动推导就在其中):
   ```tsx
   const myControlProps = (field: AnyFieldApi): AppFieldControlProps => ({
     ...fieldControlProps(field),
     'id': `xx-${field.name}`,
     'aria-describedby': `xx-${field.name}-error`,
   })   // FieldLabel htmlFor 与 FieldError id 用同一前缀
   ```
5. **`aria-required` 不手写。** 展开自动从 schema 推导(空值过不了校验 = 必填),
   手写会在可选字段上点亮错误红星。仅两处 ARIA 真空角改用标签部件的
   `required` prop:Checkbox 多选组的 `FieldLegend`、InfiniteCombobox 的 label。

## 控件绑定差异表(全表见 docs「不同控件类型」节)

| 控件 | 受控 | id 落点 | 走展开? | 手工 aria | zod 形态 |
| --- | --- | --- | --- | --- | --- |
| Input / Textarea / InputOTP | `value` + `onChange` | 控件本体 | ✅ 整体展开 | — | `z.string().min(n)`;OTP `regex(/^\d{6}$/)` |
| NumberField | `value` / `onValueChange`(`number \| null`) | **根**(`id`+`name`) | ❌ | `NumberFieldInput` 上接 describedby/invalid/onBlur | `.nullable().refine(v => v !== null, '必填文案')`,无字符串转换 |
| DatePicker | `value` / `onValueChange`(`Date \| null`) | **根**(`id`+`name`,id 转发给输入框) | ❌ | `DatePickerInput` 上接 describedby/invalid/onBlur | `z.date().nullable().refine(v => v !== null, '…')`,非法键入不落值 |
| DateRangePicker | `value` / `onValueChange`(`{from,to} \| null`,半程 `{from}` 也入表) | **根**(id 落起点输入框) | ❌ | Start/End 两个 Input **各自**接 describedby/invalid/onBlur | `z.object({from:z.date(),to:z.date().optional()}).nullable().refine(v => v !== null && v.to !== undefined, '…')` |
| Select | `value \|\| null` / `onValueChange(v ?? '')` | **SelectTrigger** | ❌ | trigger 上接 describedby/invalid | `z.string().min(1, '请选择')` |
| RadioGroup | 组上 `value`/`onValueChange` | 无(组接 `aria-labelledby` 指 `FieldLegend` 的 id) | ❌ | 各 item 接 describedby/invalid | `z.string().min(1)` |
| Checkbox / Switch | `checked` / `onCheckedChange` | 控件本体(隐藏 input) | ❌(手写 id+aria) | 本体 | 必勾 `z.boolean().refine(Boolean, '…')` |
| Checkbox 多选组 | `mode="array"` + `pushValue`/`removeValue` | 逐项 | ❌ | 错误挂 FieldSet 级 | `z.array(z.string()).min(1)` |
| Slider | `value` / `onValueChange` | 无(`aria-labelledby` 指 `FieldTitle`) | ❌ | 根上 describedby/invalid | `z.number().min(n)` |
| InfiniteCombobox | 表单存 **id 不存对象**,展示对象走局部 state | `triggerId` | ❌ | 触发按钮接 describedby/invalid | `z.string().nullable().refine(v => v !== null)` |

Checkbox 行内布局是**单层** `Field orientation="horizontal"` + `FieldContent`
包 label/描述/错误(见 complex demo 的 agreeTerms),不要发明双层 Field 嵌套。

## 分步表单(要点,全文见 docs「分步表单」节 + multi-step demo)

一个 `useForm` 贯穿所有步骤;「下一步」**不是提交**(真提交让
`submissionAttempts > 0` 全表开闸,后面步骤一渲染就带错):
`form.validate('change')` 补跑校验 → 只查本步字段 `getFieldMeta(name).errors`
→ 有错对这些字段 `setFieldMeta` 标 `isDirty + isBlurred` 开门禁 +
`focusFirstInvalidControl(formElement)`;Stepper 受控,前进点击
`eventDetails.cancel()` 拦下;推进按钮用 `pending` 吞双击。

## Common Mistakes

| 症状 | 修正 |
| --- | --- |
| 提交值里 `.trim()`/`.transform()` 没生效 | `onSubmit` 里 `schema.parse(value)`(铁律 3) |
| 为防 id 冲突全手工接 aria | 包一层覆盖 `id`/`aria-describedby`(铁律 4) |
| 可选字段带了必填红星 | 手写了 `aria-required`,删掉走推导(铁律 5) |
| 错误在用户输入前就出现 | 直读了 meta.errors,改走 `fieldErrors`(铁律 1) |
| 提交弹原生浏览器气泡 | 手写了 `<form onSubmit>` 漏 `noValidate`,改用 `formProps` |
| 错误永远不出现 | 控件漏接 `onBlur={field.handleBlur}` |
| NumberField 用字符串 schema 转数字 | 它的值原生就是 `number \| null`,直接数字 schema |
