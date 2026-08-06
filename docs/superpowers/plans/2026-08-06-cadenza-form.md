# @gedatou/cadenza-form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `packages/form` → `@gedatou/cadenza-form`：TanStack Form 的门面薄封装，API 与 `@tanstack/react-form` 一致，xchangeai-web 的表单惯例（提交处理、错误展示门禁、样板 hook）成为包默认能力。

**Architecture:** 单入口 `src/index.ts`。`export * from '@tanstack/react-form'` 全量转发；显式导出同名 `createFormHook` 覆盖官方版本（ESM 显式导出优先于 `export *`），自动注入包内单例 contexts；其余是纯函数工具（错误族、提交处理器）与两个 3 行 hook。无 UI、无 JSX。

**Tech Stack:** TypeScript、`@tanstack/react-form` ^1.32.0（dependency）、React 19（peer）、tsdown 构建、vitest + @testing-library/react（根配置已就绪，`packages/*/test/**/*.test.{ts,tsx}` 自动被发现）。

**Spec:** `docs/superpowers/specs/2026-08-06-cadenza-form-design.md`

## Global Constraints

- 包名 `@gedatou/cadenza-form`，目录 `packages/form`，版本 `0.4.0`（随仓库）。
- `@tanstack/react-form: ^1.32.0` 走 pnpm catalog（`ui` catalog）；`react >=19` 为 peerDependency。
- 导出名与 xchangeai-web `src/components/form/index.tsx` 逐字一致。
- 不进包：`FormFieldControl`、field 组件、`SubmitButton`、zod、i18n、docs 站页面。
- 测试不引入 zod：用返回 `{ fields: {...} }` 的函数 validator 走同一条 form-level → field meta.errors 通道。
- 不引入 jest-dom：断言用 `.textContent` / `document.activeElement`。
- 代码风格：@antfu eslint（无分号、单引号），pre-commit 的 nano-staged 会自动 `eslint --fix`。
- Commit 信息用 AG 规范（`<type>(form): <subject>` 小写祈使句）。**Commit 步骤仅在用户已明确授权提交时执行**（用户全局规则禁止私自 commit/push）；未授权则跳过 commit 步骤，其余照做。

---

### Task 1: 包脚手架

**Files:**
- Modify: `pnpm-workspace.yaml`（ui catalog 加一行）
- Create: `packages/form/package.json`
- Create: `packages/form/tsconfig.json`
- Create: `packages/form/tsdown.config.ts`
- Create: `packages/form/src/index.ts`（暂时只有全量转发）

**Interfaces:**
- Consumes: 无
- Produces: 可构建、可 typecheck 的空门面包；后续任务向 `src/index.ts` 追加导出。

- [ ] **Step 1: catalog 加入 @tanstack/react-form**

在 `pnpm-workspace.yaml` 的 `catalogs.ui` 中，`'@tailwindcss/postcss'` 与 `'@tanstack/react-virtual'` 之间插入下面这行（缩进与相邻行对齐，保持字母序）：

```yaml
'@tanstack/react-form': ^1.32.0
```

- [ ] **Step 2: 写 package.json**

`packages/form/package.json`：

```json
{
  "name": "@gedatou/cadenza-form",
  "type": "module",
  "version": "0.4.0",
  "description": "Thin TanStack Form facade — identical API, form conventions baked in",
  "license": "MIT",
  "homepage": "https://cadenza-ui-docs.vercel.app",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/GGGLHHH/cadenza.git",
    "directory": "packages/form"
  },
  "bugs": "https://github.com/GGGLHHH/cadenza/issues",
  "keywords": [
    "react",
    "tanstack-form",
    "form",
    "validation"
  ],
  "sideEffects": false,
  "publishConfig": {
    "access": "public"
  },
  "exports": {
    ".": "./dist/index.mjs",
    "./package.json": "./package.json"
  },
  "types": "./dist/index.d.mts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc",
    "prepack": "pnpm run build"
  },
  "peerDependencies": {
    "react": ">=19"
  },
  "dependencies": {
    "@tanstack/react-form": "catalog:ui"
  },
  "devDependencies": {
    "react": "catalog:react",
    "tsdown": "catalog:cli",
    "typescript": "catalog:cli"
  }
}
```

- [ ] **Step 3: 写 tsconfig.json 与 tsdown.config.ts**

`packages/form/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "test", "tsdown.config.ts"]
}
```

`packages/form/tsdown.config.ts`（与 utils 包逐字相同）：

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  publint: true,
})
```

- [ ] **Step 4: 写最小 src/index.ts**

```ts
export * from '@tanstack/react-form'
```

- [ ] **Step 5: 安装并验证构建**

Run: `pnpm install`（仓库根目录）
Expected: lockfile 更新，`packages/form` 进 workspace，无 trustPolicy/minimumReleaseAge 报错。

Run: `pnpm --filter @gedatou/cadenza-form build`
Expected: 产出 `dist/index.mjs` + `dist/index.d.mts`，publint 无错误。

Run: `pnpm --filter @gedatou/cadenza-form typecheck`
Expected: 通过。

- [ ] **Step 6: Commit（仅在已授权时）**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml packages/form
git commit -m "feat(form): scaffold @gedatou/cadenza-form facade package"
```

---

### Task 2: 错误族、常量与类型（含展示门禁）

**Files:**
- Modify: `packages/form/src/index.ts`（追加）
- Test: `packages/form/test/normalize-field-errors.test.ts`
- Test: `packages/form/test/error-gate.test.tsx`

**Interfaces:**
- Consumes: Task 1 的包骨架。
- Produces: `FormFieldError`（`{ message?: string }`）、`AppFieldControlProps`、`normalizeFieldErrors(errors: unknown[]): FormFieldError[]`、`fieldErrorId(name: string): string`、`fieldShouldShowError(field: AnyFieldApi): boolean`、`fieldErrors(field: AnyFieldApi): FormFieldError[]`、`fieldHasError(field): boolean`、`fieldErrorMessage(field): string | undefined`、`fieldInvalidState(field): { errorId: string, invalid: boolean }`、`fieldControlProps(field): AppFieldControlProps`、`silentFieldUpdateOptions`、`validatingFieldUpdateOptions`。Task 4 的测试会用 `fieldControlProps`/`fieldErrorMessage`。

- [ ] **Step 1: 写纯函数部分的失败测试**

`packages/form/test/normalize-field-errors.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { fieldErrorId, normalizeFieldErrors } from '../src'

describe('normalizeFieldErrors', () => {
  it('字符串错误包装成 { message }', () => {
    expect(normalizeFieldErrors(['必填'])).toEqual([{ message: '必填' }])
  })

  it('递归拍平嵌套数组', () => {
    expect(normalizeFieldErrors([['a', ['b']], 'c'])).toEqual([
      { message: 'a' },
      { message: 'b' },
      { message: 'c' },
    ])
  })

  it('带 message 的对象只保留 message（zod issue 形状）', () => {
    expect(normalizeFieldErrors([{ message: '太短', code: 'too_small' }])).toEqual([
      { message: '太短' },
    ])
  })

  it('无 message 的值静默丢弃', () => {
    expect(normalizeFieldErrors([null, undefined, 42, { code: 'x' }])).toEqual([])
  })
})

describe('fieldErrorId', () => {
  it('清洗非法字符后拼 -error 后缀', () => {
    expect(fieldErrorId('user.name')).toBe('user-name-error')
    expect(fieldErrorId('plain')).toBe('plain-error')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/form/test/normalize-field-errors.test.ts`
Expected: FAIL——`../src` 没有 `normalizeFieldErrors`/`fieldErrorId` 导出。

- [ ] **Step 3: 实现（向 src/index.ts 追加）**

在 `export * from '@tanstack/react-form'` 之后追加（import 放文件顶部）：

```ts
import type { AnyFieldApi, UpdateMetaOptions } from '@tanstack/react-form'

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
    errorId: fieldErrorId(field.name),
    invalid: fieldHasError(field),
  }
}

export function fieldControlProps(field: AnyFieldApi): AppFieldControlProps {
  const { errorId, invalid } = fieldInvalidState(field)

  return {
    'id': field.name,
    'name': field.name,
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
```

注意：`fieldErrorId` 的正则 `/[^\w-]/g` 与 xchangeai 的 `/[^a-zA-Z0-9_-]/g` 语义相同（`\w` 即 `[A-Za-z0-9_]`），写法按本仓库 eslint 的 `regexp/prefer-w` 规则。

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run packages/form/test/normalize-field-errors.test.ts`
Expected: PASS（5 个用例）。

- [ ] **Step 5: 写门禁行为的失败测试**

`packages/form/test/error-gate.test.tsx`——移植 xchangeai `form.test.tsx` 的核心行为"form-level onChange 校验下，错误等 blur 或提交后才展示"：

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { fieldErrors, useForm } from '../src'

function GateProbe() {
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) =>
        value.name.length < 2 ? { fields: { name: { message: '太短' } } } : undefined,
    },
    onSubmit: () => {},
  })

  return (
    <form
      data-testid="form"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {field => (
          <>
            <input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
            <span data-testid="errors">
              {fieldErrors(field).map(error => error.message).join(',')}
            </span>
          </>
        )}
      </form.Field>
      <button type="submit">提交</button>
    </form>
  )
}

it('onChange 校验实时跑，但错误在 blur 前隐藏、blur 后显示', () => {
  render(<GateProbe />)
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: 'a' } })
  expect(screen.getByTestId('errors').textContent).toBe('')

  fireEvent.blur(input)
  expect(screen.getByTestId('errors').textContent).toBe('太短')
})

it('未 blur 但提交过（submissionAttempts > 0）也显示错误', async () => {
  render(<GateProbe />)

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(screen.getByTestId('errors').textContent).toBe('太短')
  })
})
```

测试构造的三个刻意选择（实施期勘误，依据 form-core 1.33.3 源码与上游参照测试）：

1. 提交路径用 `fireEvent.submit(form)` 而非点击按钮——jsdom 不实现"点击 submit 按钮 → 隐式表单提交"。
2. 提交测试用 **pristine 表单直接提交**（不先 `fireEvent.change`）——form-core `_handleSubmit`（FormApi.js:509-517）在"表单已被 change 校验判无效"时的**首次**提交会早退（只递增 `submissionAttempts`、回调 `onSubmitInvalid`），不重跑校验、field 不重渲染。pristine 提交与 xchangeai `form.test.tsx` 测试 1 的场景一致：完整提交校验 → 错误写入 field meta → 重渲染 → 未 blur 也显示。
3. validator 返回**新鲜错误对象** `{ message: '太短' }` 而非常量字符串——模拟 zod 每次校验产出新 issue 对象的形态。

- [ ] **Step 6: 跑门禁测试确认通过**

Run: `pnpm vitest run packages/form/test/error-gate.test.tsx`
Expected: PASS。此测试写在实现之后（Step 3 已实现 `fieldErrors`），作用是把行为钉死；若 FAIL 则说明门禁移植有误，修实现而不是改测试。

- [ ] **Step 7: Commit（仅在已授权时）**

```bash
git add packages/form/src/index.ts packages/form/test
git commit -m "feat(form): port field error family and update-meta constants"
```

---

### Task 3: formSubmitHandler 与 focusFirstInvalidControl

**Files:**
- Modify: `packages/form/src/index.ts`（追加）
- Test: `packages/form/test/form-submit-handler.test.tsx`

**Interfaces:**
- Consumes: Task 1 的包骨架（不依赖 Task 2 的导出）。
- Produces: `formSubmitHandler(handleSubmit: () => Promise<void> | void, options?: { focusFirstError?: boolean }): (event: FormEvent<HTMLFormElement>) => void`、`focusFirstInvalidControl(form: HTMLFormElement): void`。

- [ ] **Step 1: 写失败测试**

`packages/form/test/form-submit-handler.test.tsx`：

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { formSubmitHandler } from '../src'

it('preventDefault 生效且调用 handleSubmit', () => {
  const handleSubmit = vi.fn()
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(handleSubmit)}>
      <button type="submit">提交</button>
    </form>,
  )

  // fireEvent 返回 false 即 preventDefault 被调用
  expect(fireEvent.submit(screen.getByTestId('form'))).toBe(false)
  expect(handleSubmit).toHaveBeenCalledOnce()
})

it('提交 settle 后聚焦首个非禁用 invalid 控件', async () => {
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(() => {})}>
      <input aria-invalid="true" disabled data-testid="disabled-bad" />
      <input aria-invalid="true" data-testid="bad" />
    </form>,
  )

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByTestId('bad'))
  })
})

it('focusFirstError: false 时不聚焦', async () => {
  const handleSubmit = vi.fn()
  render(
    <form data-testid="form" onSubmit={formSubmitHandler(handleSubmit, { focusFirstError: false })}>
      <input aria-invalid="true" data-testid="bad" />
    </form>,
  )

  fireEvent.submit(screen.getByTestId('form'))
  await waitFor(() => expect(handleSubmit).toHaveBeenCalledOnce())
  // 给 rAF 一个机会跑完，确认没有聚焦发生
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
  expect(document.activeElement).not.toBe(screen.getByTestId('bad'))
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/form/test/form-submit-handler.test.tsx`
Expected: FAIL——`formSubmitHandler` 未导出。

- [ ] **Step 3: 实现（向 src/index.ts 追加）**

import 区补 `import type { FormEvent } from 'react'`，然后追加：

```ts
interface FormSubmitHandlerOptions {
  focusFirstError?: boolean
}

const INVALID_FORM_CONTROL_SELECTOR
  = '[aria-invalid="true"]:not(:disabled):not([aria-disabled="true"])'

export function formSubmitHandler(
  handleSubmit: () => Promise<void> | void,
  { focusFirstError = true }: FormSubmitHandlerOptions = {},
) {
  return (event: FormEvent<HTMLFormElement>) => {
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

export function focusFirstInvalidControl(form: HTMLFormElement) {
  const schedule = window.requestAnimationFrame ?? window.setTimeout

  schedule(() => {
    if (!form.isConnected) {
      return
    }

    const invalidControl = form.querySelector<HTMLElement>(INVALID_FORM_CONTROL_SELECTOR)
    invalidControl?.focus()
  })
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run packages/form/test/form-submit-handler.test.tsx`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit（仅在已授权时）**

```bash
git add packages/form/src/index.ts packages/form/test/form-submit-handler.test.tsx
git commit -m "feat(form): port formSubmitHandler with invalid-control focus"
```

---

### Task 4: createFormHook 覆盖与 contexts 导出

**Files:**
- Modify: `packages/form/src/index.ts`（追加）
- Test: `packages/form/test/create-form-hook.test.tsx`

**Interfaces:**
- Consumes: Task 2 的 `fieldControlProps`、`fieldErrorMessage`（测试用）。
- Produces: `createFormHook(options?: { fieldComponents?, formComponents? })`（返回官方 `{ useAppForm, withForm, ... }` 原样透传）、`useFieldContext`、`useFormContext`。

- [ ] **Step 1: 写失败测试**

`packages/form/test/create-form-hook.test.tsx`——证明：使用方只传 fieldComponents（无 contexts），其组件内 `useFieldContext` 能取到字段，错误门禁贯通：

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { createFormHook, fieldControlProps, fieldErrorMessage, useFieldContext } from '../src'

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
      <span data-testid="message">{fieldErrorMessage(field) ?? ''}</span>
    </label>
  )
}

const { useAppForm } = createFormHook({ fieldComponents: { TextField } })

function Demo() {
  const form = useAppForm({
    defaultValues: { name: '' },
    validators: {
      onChange: ({ value }) => (value.name ? undefined : { fields: { name: '必填' } }),
      onBlur: ({ value }) => (value.name ? undefined : { fields: { name: '必填' } }),
    },
    onSubmit: () => {},
  })

  return (
    <form.AppField name="name">
      {field => <field.TextField label="姓名" />}
    </form.AppField>
  )
}

it('使用方注入的 field 组件经包内单例 contexts 拿到字段，门禁贯通', () => {
  render(<Demo />)
  const input = screen.getByLabelText('姓名')

  // fieldControlProps 的 aria 接线
  expect(input).toHaveProperty('id', 'name')
  expect(input.getAttribute('aria-describedby')).toBe('name-error')
  expect(input.getAttribute('aria-invalid')).toBe('false')

  fireEvent.blur(input)
  expect(screen.getByTestId('message').textContent).toBe('必填')
  expect(input.getAttribute('aria-invalid')).toBe('true')
})

it('不传 fieldComponents 也能创建 useAppForm', () => {
  const { useAppForm: useBareAppForm } = createFormHook()
  expect(typeof useBareAppForm).toBe('function')
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/form/test/create-form-hook.test.tsx`
Expected: FAIL——本包尚无显式 `createFormHook`/`useFieldContext` 导出（星号转发的官方 `createFormHook` 签名不含默认 contexts，`useFieldContext` 则完全不存在）。

- [ ] **Step 3: 实现（向 src/index.ts 追加）**

import 区改为从 tanstack 引入（注意别名避开与本文件导出撞名）：

```ts
import type { ComponentType } from 'react'
import {
  createFormHookContexts,
  createFormHook as createTanstackFormHook,
} from '@tanstack/react-form'
```

（命名导入按别名字母序、type import 在前——本仓库 perfectionist 规则；最终 import 区合并后跑 `pnpm fix` 收尾。）

追加：

```ts
const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

export { useFieldContext, useFormContext }

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
```

要点：显式 `export function createFormHook` 会遮蔽 `export *` 里的官方同名导出（ESM 规则），这正是"API 一致但少写 contexts"的实现机制。返回值不做包装，官方 `useAppForm`/`withForm` 原样透传。

实施期勘误（两处）：

1. 返回类型必须**保持推断**，不可写 `: ReturnType<typeof createTanstackFormHook>`——那会按 tanstack 泛型默认值实例化，触发 TS2719 且把 d.mts 固化成非泛型（丢失字段组件键级类型）。本仓库 eslint 为 `type: 'lib'` 配置，`ts/explicit-function-return-type` 是 error 级，故用上面的单行 disable。
2. 测试的 validator 需同时挂 `onBlur`——只挂 `onChange` 时值从未变过、校验从未跑过，blur 后 `meta.errors` 仍为空，断言的 `'必填'` 永远不会出现。

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run packages/form/test/create-form-hook.test.tsx`
Expected: PASS（2 个用例）。

Run: `pnpm --filter @gedatou/cadenza-form build`
Expected: 构建通过——确认 bundler 对 `export *` + 同名显式导出的遮蔽处理无警告错误。

- [ ] **Step 5: Commit（仅在已授权时）**

```bash
git add packages/form/src/index.ts packages/form/test/create-form-hook.test.tsx
git commit -m "feat(form): createFormHook with pre-wired contexts"
```

---

### Task 5: useFormReset 与 useFormSubmitting

**Files:**
- Modify: `packages/form/src/index.ts`（追加）
- Test: `packages/form/test/form-hooks.test.tsx`

**Interfaces:**
- Consumes: Task 1 的包骨架。
- Produces: `useFormReset<TFormData>(form: { reset: (values?: TFormData) => void }, defaultValues: TFormData): void`、`useFormSubmitting(form: AnyFormApi): boolean`。

- [ ] **Step 1: 写失败测试**

`packages/form/test/form-hooks.test.tsx`：

```tsx
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useForm, useFormReset, useFormSubmitting } from '../src'

it('useFormReset：defaultValues 引用变化时整表回填（覆盖脏值）', () => {
  const { result, rerender } = renderHook(
    ({ defaultValues }) => {
      const form = useForm({ defaultValues })
      useFormReset(form, defaultValues)
      return form
    },
    { initialProps: { defaultValues: { name: 'a' } } },
  )

  act(() => result.current.setFieldValue('name', 'dirty'))
  expect(result.current.state.values.name).toBe('dirty')

  rerender({ defaultValues: { name: 'b' } })
  expect(result.current.state.values.name).toBe('b')
})

it('useFormReset：同一引用重渲染不触发回填', () => {
  const defaultValues = { name: 'a' }
  const { result, rerender } = renderHook(() => {
    const form = useForm({ defaultValues })
    useFormReset(form, defaultValues)
    return form
  })

  act(() => result.current.setFieldValue('name', 'dirty'))
  rerender()
  expect(result.current.state.values.name).toBe('dirty')
})

it('useFormSubmitting：跟随 isSubmitting', async () => {
  let resolveSubmit: (() => void) | undefined
  const { result } = renderHook(() => {
    const form = useForm({
      defaultValues: { name: '' },
      onSubmit: () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    })
    return { form, submitting: useFormSubmitting(form) }
  })

  expect(result.current.submitting).toBe(false)

  act(() => {
    void result.current.form.handleSubmit()
  })
  expect(result.current.submitting).toBe(true)

  // handleSubmit 的校验链是异步的：等 onSubmit 真正被调用、resolveSubmit 被赋值
  await waitFor(() => expect(resolveSubmit).toBeDefined())

  await act(async () => {
    resolveSubmit?.()
  })
  expect(result.current.submitting).toBe(false)
})
```

实施期勘误：第三个测试必须在 resolve 前 `waitFor(resolveSubmit 已赋值)`——`handleSubmit` 的校验链是异步的，同步 `act` 返回时 `onSubmit` 尚未被调用，直接 `resolveSubmit?.()` 会静默空转、promise 永不 resolve。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run packages/form/test/form-hooks.test.tsx`
Expected: FAIL——`useFormReset`/`useFormSubmitting` 未导出。

- [ ] **Step 3: 实现（向 src/index.ts 追加）**

import 区补：

```ts
import type { AnyFormApi } from '@tanstack/react-form'
import { useSelector } from '@tanstack/react-form'
import { useEffect } from 'react'
```

追加：

```ts
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
```

实施期勘误：`useStore` 在 tanstack 上游已标记 `@deprecated`（本仓库 `ts/no-deprecated` 会告警），改用 drop-in 替代 `useSelector`（同样由 `@tanstack/react-form` 导出）。

要点：`form` 进依赖数组是安全的——tanstack 的 `useForm` 返回稳定实例，等价于 xchangeai 那 8 处 `[defaultValues]` + eslint-disable 的行为，但不需要 disable。

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run packages/form/test/form-hooks.test.tsx`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit（仅在已授权时）**

```bash
git add packages/form/src/index.ts packages/form/test/form-hooks.test.tsx
git commit -m "feat(form): useFormReset and useFormSubmitting boilerplate hooks"
```

---

### Task 6: README 与全量验证

**Files:**
- Create: `packages/form/README.md`

**Interfaces:**
- Consumes: Task 1–5 的全部导出。
- Produces: 发布就绪的包。

- [ ] **Step 1: 写 README**

`packages/form/README.md`：

````markdown
# @gedatou/cadenza-form

TanStack Form 的门面薄封装：API 与 `@tanstack/react-form` 完全一致（全量转发），
另附一组表单惯例默认能力。只需安装本包，不需要再装 `@tanstack/react-form`。

## 用法

```tsx
import {
  createFormHook,
  fieldControlProps,
  fieldErrors,
  formSubmitHandler,
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
    <form onSubmit={formSubmitHandler(form.handleSubmit)}>
      <form.AppField name="name">{field => <field.TextField label="姓名" />}</form.AppField>
    </form>
  )
}
```

## 与官方 API 的差异

- `createFormHook(options?)`：contexts 由包内单例自动注入，`fieldComponents`/`formComponents`
  可省略；需要自定义 contexts 时直接使用 `@tanstack/react-form`。
- 其余导出与官方一致，另加：
  - `formSubmitHandler` / `focusFirstInvalidControl`：preventDefault + 提交后聚焦首个
    `[aria-invalid="true"]` 控件。
  - 错误展示门禁族 `fieldErrors` / `fieldErrorMessage` / `fieldShouldShowError` /
    `fieldInvalidState` / `fieldControlProps` / `normalizeFieldErrors`：onChange 实时校验，
    错误信息等字段 blur 过或表单提交过才展示。
  - `silentFieldUpdateOptions` / `validatingFieldUpdateOptions`：程序化 `setFieldValue`
    的两档更新静默级别。
  - `useFormReset(form, defaultValues)` / `useFormSubmitting(form)`：异步默认值回填与
    提交态订阅的样板消除。
````

- [ ] **Step 2: 全量验证**

Run: `pnpm vitest run packages/form`
Expected: 全部测试 PASS（4 个文件，13 个用例）。

Run: `pnpm --filter @gedatou/cadenza-form build && pnpm --filter @gedatou/cadenza-form typecheck`
Expected: 构建 + publint + typecheck 通过。

Run: `pnpm lint`
Expected: 无错误（风格问题先 `pnpm fix`）。

Run: `pnpm vitest run`
Expected: 仓库全部测试（含 ui/utils 既有测试）无回归。

- [ ] **Step 3: Commit（仅在已授权时）**

```bash
git add packages/form/README.md
git commit -m "docs(form): package readme"
```
