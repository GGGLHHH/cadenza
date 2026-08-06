# @gedatou/cadenza-form 设计

日期：2026-08-06
状态：已批准（方案 A：门面包）

## 背景与目标

xchangeai-web（`/Users/ggg/wuhan/xchangeai-web`）基于 `@tanstack/react-form` 1.32 形成了一套稳定的表单惯例，集中在 `src/components/form/index.tsx`，并被 `src/architecture/tanstack-form-migration.test.ts` 架构测试钉死。16 个生产表单只用 `defaultValues` + `validators.onChange: schema` + `onSubmit` 三个键，真正的"配置"是一组惯例：

1. `createFormHook` app-form 模式（contexts 单例）；
2. `formSubmitHandler`：preventDefault + stopPropagation + 提交后聚焦首个 `[aria-invalid="true"]` 控件；
3. 错误展示门禁：onChange 实时校验，但错误信息等字段 blur 过或表单提交过（`submissionAttempts > 0`）才展示；
4. 错误取值族（`fieldErrors` 等）与 `silent/validating` 字段更新常量；
5. 两处高频样板：`form.reset(defaultValues)` effect（8 处逐字重复）、`isSubmitting` selector（8 处）。

目标：把这套惯例沉淀为 cadenza monorepo 的新包 `@gedatou/cadenza-form`——TanStack Form 的**薄门面（facade）**，使用方法与 TanStack Form API 保持一致，上述惯例成为包的默认能力。xchangeai-web 将来迁移时只需把 import 路径从 `@/components/form` 换成 `@gedatou/cadenza-form`（其架构测试本就禁止直接 import `useForm`）。

## 非目标

- 不带任何 UI 组件：`FormFieldControl`（渲染 `Field`/`FieldLabel`/`FieldError`）、5 个 field 组件（TextField 等）、`SubmitButton` 均不进包；headless 逻辑已由 `fieldControlProps()` 完整承载，UI 层由使用方注入。
- 不依赖 zod / 任何校验库：Standard Schema 经 TanStack Form 自身类型通道传入。
- 不做 i18n；schema 工厂 + `useMemo` 惯例留在使用方。
- 不建 docs 站页面（可后续单独做）。

## 形态：门面包（方案 A）

- `@tanstack/react-form` 作为 **dependency**（`^1.32.0`），包内 `export * from '@tanstack/react-form'` 全量转发。
- 使用方只安装 `@gedatou/cadenza-form`，从单一入口 import 一切；单实例保证。
- `react >=19` 为 peerDependency（与 `@gedatou/cadenza-utils` 一致）。

## API 面

导出名与 xchangeai-web `src/components/form/index.tsx` 逐字一致（迁移 = 改 import 路径）：

| 类别 | 导出 | 说明 |
|---|---|---|
| 转发 | `export * from '@tanstack/react-form'` | `useForm`、`useStore`、`revalidateLogic`、全部类型 |
| 入口 | `createFormHook({ fieldComponents?, formComponents? })` | **覆盖官方同名导出**（ESM 显式导出优先于 `export *`）。包内单例 `createFormHookContexts()` 自动注入，签名其余与官方一致，返回 `{ useAppForm, withForm }` |
| contexts | `useFieldContext`、`useFormContext` | xchangeai 未导出；headless 使用方编写自己的 field 组件必需 |
| 提交 | `formSubmitHandler(handleSubmit, { focusFirstError = true })` | 返回 `<form onSubmit>` 处理器；preventDefault + stopPropagation + finally 聚焦 |
| 提交 | `focusFirstInvalidControl(form: HTMLFormElement)` | rAF 调度聚焦 `[aria-invalid="true"]:not(:disabled):not([aria-disabled="true"])`；xchangeai 中为私有，此包导出 |
| 错误族 | `fieldErrors(field)` | 过门禁后返回 `FormFieldError[]`，未过门禁返回 `[]` |
| 错误族 | `fieldHasError(field)`、`fieldErrorMessage(field)` | 派生自 `fieldErrors` |
| 错误族 | `fieldShouldShowError(field)` | `meta.isBlurred \|\| form.state.submissionAttempts > 0` |
| 错误族 | `fieldErrorId(name)`、`fieldInvalidState(field)`、`fieldControlProps(field)` | aria 接线：`{ id, name, 'aria-describedby', 'aria-invalid' }` |
| 错误族 | `normalizeFieldErrors(errors)` | 递归拍平；string → `{message}`；带 message 对象保留；其余丢弃 |
| 常量 | `silentFieldUpdateOptions` | `{ dontRunListeners: true, dontUpdateMeta: true, dontValidate: true }` |
| 常量 | `validatingFieldUpdateOptions` | `{ dontRunListeners: true }` |
| 样板吸收 | `useFormReset(form, defaultValues)` | `defaultValues` 引用变化时 `form.reset(defaultValues)`（替代 8 处重复 effect） |
| 样板吸收 | `useFormSubmitting(form)` | `useSelector(form.store, s => s.isSubmitting)` 的语义化包装（`useStore` 上游已弃用） |
| 类型 | `FormFieldError`（`{ message?: string }`）、`AppFieldControlProps` | |

已知取舍：官方 `createFormHook`（自带 contexts 参数的原始版本）被同名覆盖后无法从本包取得；需要自定义 contexts 的场景直接安装 `@tanstack/react-form`。判断为不会发生（xchangeai 全仓也只有一个 contexts 单例）。

## 行为规范（由测试锁定）

1. **错误门禁**：`validators.onChange` 照常实时校验（`canSubmit`/`isValid` 反映真实状态），但 `fieldErrors` 在字段未 blur 且表单未提交过时返回空数组——与 xchangeai-web 现网行为逐字一致（其 `form.test.tsx` "keeps field errors hidden until blur during form-level change validation" 的行为移植）。不采用官方 `revalidateLogic`（其延迟的是校验本身，`isValid` 时序不同）。
2. **提交流程**：`formSubmitHandler` 包装 `form.handleSubmit`；提交 settle 后（无论成败）若 `focusFirstError` 未关闭，rAF 调度聚焦表单内首个非禁用 invalid 控件；表单已卸载（`!form.isConnected`）则跳过。
3. **normalizeFieldErrors**：嵌套数组递归拍平；zod issue（含 `message`）与纯字符串统一为 `FormFieldError`；无 message 的值静默丢弃。

## 包工程

- 目录 `packages/form`，纳入 `pnpm-workspace.yaml` 的 `packages/*` 通配（无需改动）。
- `package.json` 以 `packages/utils` 为模板：tsdown 构建（`dts: true, publint: true`）、`exports` 仅 `.` 与 `./package.json`、`files: [dist]`、`publishConfig.access: public`、版本随仓库 0.4.0。
- `@tanstack/react-form: ^1.32.0` 进 pnpm catalog（`ui` catalog）。
- tsconfig 继承根配置，与 utils 同构。
- 源码布局：`src/index.ts` 单入口（纯逻辑无 JSX，逻辑量小，不拆多文件）。

## 测试

`packages/form/test/`，vitest + @testing-library/react（根 vitest.config.ts 已有的测试基建）：

1. 门禁行为：onChange 校验下，错误在 blur 前不展示、blur 后展示；未 blur 但提交过（`submissionAttempts > 0`）也展示。
2. `normalizeFieldErrors`：嵌套数组 / 字符串 / zod 形对象 / 垃圾值。
3. `formSubmitHandler`：preventDefault 生效；提交失败后聚焦首个 invalid 控件；`focusFirstError: false` 不聚焦。
4. `createFormHook` 包装：使用方注入的 field 组件内 `useFieldContext` 能取到字段。
5. `useFormReset` / `useFormSubmitting` 基本行为。

## 迁移路径（xchangeai-web，本次不实施）

1. `src/components/form/index.tsx` 中逻辑部分改为 `export ... from '@gedatou/cadenza-form'`，仅保留 UI 绑定（5 个 field 组件、SubmitButton、FormFieldControl）。
2. `createFormHook` 调用替换为本包版本（去掉 contexts 参数）。
3. 8 处 reset effect → `useFormReset`；8 处 isSubmitting selector → `useFormSubmitting`。
4. 架构测试的 import 白名单相应放宽到 `@gedatou/cadenza-form`。
