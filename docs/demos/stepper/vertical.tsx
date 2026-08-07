import type { ReactElement } from 'react'
import { Stepper } from '@gedatou/cadenza-ui'

// orientation="vertical":根竖排,连线随之转为竖线;默认组合同样适用
export default function VerticalDemo(): ReactElement {
  return <Stepper defaultValue={2} orientation="vertical" steps={4} />
}
