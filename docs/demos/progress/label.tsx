import type { ReactElement } from 'react'
import { Progress, ProgressLabel, ProgressValue } from '@gedatou/cadenza-ui'

// ProgressLabel names the bar (`aria-labelledby` is wired for you) and
// ProgressValue prints the formatted number — `format` decides how
export default function LabelDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-6 inline-full max-inline-sm">
      <Progress value={56}>
        <ProgressLabel>Upload progress</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={3.2} max={8} format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}>
        <ProgressLabel>Disk</ProgressLabel>
        <ProgressValue>{formatted => `${formatted} of 8 GB`}</ProgressValue>
      </Progress>
    </div>
  )
}
