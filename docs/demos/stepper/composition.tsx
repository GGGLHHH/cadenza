import type { ReactElement } from 'react'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@gedatou/cadenza-ui'

const steps = [
  { step: 1, title: '账户', description: '填写基本信息' },
  { step: 2, title: '配置', description: '选择套餐与区域' },
  { step: 3, title: '确认', description: '核对并提交' },
]

// 手写组合:标题与描述放进 trigger,整块文字都可点击跳步;连线只写在非末项。
// Indicator 的数字/✓/Spinner 是部件自带的默认视觉,不用自己写
export default function CompositionDemo(): ReactElement {
  return (
    <Stepper defaultValue={2}>
      {steps.map(({ description, step, title }) => (
        <StepperItem className="not-last:flex-1" key={step} step={step}>
          <StepperTrigger>
            <StepperIndicator />
            <div className="text-start">
              <StepperTitle>{title}</StepperTitle>
              <StepperDescription>{description}</StepperDescription>
            </div>
          </StepperTrigger>
          {step < steps.length && <StepperSeparator className="mx-4" />}
        </StepperItem>
      ))}
    </Stepper>
  )
}
