import type { ReactElement } from 'react'
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { cn } from '#lib/utils'

export interface NumberFieldProps extends NumberFieldPrimitive.Root.Props {
  /** 默认组合里内层输入框的占位文案；自己组合 children 时请写在 `NumberFieldInput` 上。 */
  placeholder?: string
}
export type NumberFieldState = NumberFieldPrimitive.Root.State
/** `onValueChange` 的第二参。可取消。 */
export type NumberFieldChangeEventDetails = NumberFieldPrimitive.Root.ChangeEventDetails
/** `onValueCommitted` 的第二参——完成通知,无 `cancel()`。 */
export type NumberFieldCommitEventDetails = NumberFieldPrimitive.Root.CommitEventDetails
export type NumberFieldGroupProps = NumberFieldPrimitive.Group.Props
export type NumberFieldGroupState = NumberFieldPrimitive.Group.State
export type NumberFieldInputProps = NumberFieldPrimitive.Input.Props
export type NumberFieldInputState = NumberFieldPrimitive.Input.State
export type NumberFieldIncrementProps = NumberFieldPrimitive.Increment.Props
export type NumberFieldIncrementState = NumberFieldPrimitive.Increment.State
export type NumberFieldDecrementProps = NumberFieldPrimitive.Decrement.Props
export type NumberFieldDecrementState = NumberFieldPrimitive.Decrement.State

/**
 * The published NumberField — Base UI's `NumberField` in the base-nova skin.
 * A stepper-flanked numeric input: typing, arrow keys, +/- buttons, `format`
 * (Intl) and `min`/`max`/`step` all come from the primitive.
 *
 * ```tsx
 * <NumberField defaultValue={4} min={0} max={20} />
 * ```
 *
 * - **不写 children 就有完整默认组合**(Group > Decrement > Input > Increment);
 *   写了 children 则整层归你,从 `NumberFieldGroup` 起自己搭。
 * - **受控三件套** `value` / `defaultValue` / `onValueChange(value, details)`,
 *   受控空值是 `null`(输入清空时回它)。`onValueCommitted` 在交互落定后另行触发。
 * - **label 通道**:根上的 `id` 由 Base UI 直接路由到内层 `<input>`,所以默认
 *   组合也能吃 `FieldLabel htmlFor`。没有可见 label 时传 `aria-label`,默认组合
 *   会把它转交给输入框。
 * - **表单序列化**是 Base UI 的:有 `name` 才渲染隐藏 input。
 * - 步进按钮自带上游的英文 `aria-label`(Increase/Decrease)且 `tabIndex={-1}`
 *   (键盘路径是输入框的方向键);要本地化就组合 `NumberFieldIncrement
 *   aria-label="…"` 覆盖。ScrubArea 部件未收录,需要时直接用
 *   `@base-ui/react/number-field` 组合。
 *
 * `className` 到达 Base UI 槽位,函数形态 `(state) => string` 可用,state 即
 * `NumberFieldState`。
 */
export function NumberField({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  className,
  placeholder,
  ...props
}: NumberFieldProps): ReactElement {
  const composed = children !== undefined

  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      aria-label={composed ? ariaLabel : undefined}
      aria-labelledby={composed ? ariaLabelledBy : undefined}
      className={cn('inline-full', className)}
      {...props}
    >
      {composed
        ? children
        : (
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                placeholder={placeholder}
              />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          )}
    </NumberFieldPrimitive.Root>
  )
}

/** 一行式的组框:边框、圆角、焦点环与 invalid 环都画在这里。 */
export function NumberFieldGroup({ className, ...props }: NumberFieldGroupProps): ReactElement {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        `
          flex items-center overflow-hidden rounded-lg border border-input
          transition-colors outline-none block-8 inline-full min-inline-0
          has-aria-invalid:border-destructive has-aria-invalid:ring-3
          has-aria-invalid:ring-destructive/20
          has-[input:focus-visible]:ring-3
          has-[input:focus-visible]:not-has-aria-invalid:border-ring
          has-[input:focus-visible]:not-has-aria-invalid:ring-ring/50
          dark:bg-input/30
          dark:has-aria-invalid:border-destructive/50
          dark:has-aria-invalid:ring-destructive/40
          data-disabled:bg-input/50 data-disabled:opacity-50
          dark:data-disabled:bg-input/80
        `,
        className,
      )}
      {...props}
    />
  )
}

/** 中间的真输入框:无自有边框,环由组框统一画。 */
export function NumberFieldInput({ className, ...props }: NumberFieldInputProps): ReactElement {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      className={cn(
        `
          flex-1 bg-transparent px-2.5 py-1 text-center text-base
          transition-colors outline-none block-full inline-full min-inline-0
          placeholder:text-muted-foreground
          md:text-sm
        `,
        className,
      )}
      {...props}
    />
  )
}

const stepperClassName = `
  flex shrink-0 items-center justify-center border-input bg-transparent
  text-muted-foreground transition-colors select-none block-full inline-8
  hover:bg-muted hover:text-foreground
  data-disabled:opacity-50
  [&_svg]:block-4 [&_svg]:inline-4
`

/** 减号步进钮。不写 children 就渲染默认的减号图标。 */
export function NumberFieldDecrement({ children, className, ...props }: NumberFieldDecrementProps): ReactElement {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      className={cn(stepperClassName, 'border-e', className)}
      {...props}
    >
      {children ?? <IconMinus aria-hidden />}
    </NumberFieldPrimitive.Decrement>
  )
}

/** 加号步进钮。不写 children 就渲染默认的加号图标。 */
export function NumberFieldIncrement({ children, className, ...props }: NumberFieldIncrementProps): ReactElement {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      className={cn(stepperClassName, 'border-s', className)}
      {...props}
    >
      {children ?? <IconPlus aria-hidden />}
    </NumberFieldPrimitive.Increment>
  )
}
