import type { ReactElement } from 'react'
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerInput,
  ColorPickerPopup,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@gedatou/cadenza-ui'

// 组合即配置:弹层内容自己写,不放 channel="alpha" 的滑杆,它就是一个
// 只出不透明色的选择器;触发器里也可以在 swatch 旁边放自己的文案
export default function OpaqueDemo(): ReactElement {
  return (
    <ColorPicker defaultValue="#0ea5e9">
      <ColorPickerTrigger aria-label="背景色">
        <ColorPickerSwatch />
        <span className="pe-1 text-sm">背景色</span>
      </ColorPickerTrigger>
      <ColorPickerPopup>
        <ColorPickerArea />
        <ColorPickerSlider channel="hue" />
        <ColorPickerInput />
      </ColorPickerPopup>
    </ColorPicker>
  )
}
