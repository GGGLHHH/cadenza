import { describe, expect, it } from 'vitest'
import { iconDataFile } from '../scripts/icon-to-data.mjs'

// A made-up icon in the shape animate-ui's registry serves them: a driven
// group around a shape that follows it, a plain shape, and an animated svg.
const SOURCE = `'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@animate-ui/react/icons';

type SampleProps = IconProps<keyof typeof animations>;

const SPIN = 90;

const animations = {
  default: {
    group: { initial: { rotate: 0 }, animate: { rotate: SPIN } },
    dot: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: SampleProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="initial"
      animate={controls}
      {...props}
    >
      <motion.g variants={variants.group} initial="initial" animate={controls}>
        <motion.circle cx={12} cy={12} r="2" variants={variants.dot} />
      </motion.g>
      <path d="M4 4h16" />
    </motion.svg>
  );
}

function Sample(props: SampleProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, Sample, Sample as SampleIcon, type SampleProps, type SampleProps as SampleIconProps };
`

describe('iconDataFile', () => {
  it('turns an icon module into shapes, kept animations and helpers', () => {
    const { exportName, text } = iconDataFile('sample', SOURCE)
    expect(exportName).toBe('SampleIcon')
    expect(text.startsWith('\'use client\'')).toBe(true)
    expect(text).toContain('import type { Variants } from \'motion/react\'')
    expect(text).toContain('const SPIN = 90;')
    expect(text).toContain('export type SampleIconProps = IconProps<keyof typeof animations & string>')
    expect(text).toContain(
      '["g", {  }, "group", [["circle", { cx: 12, cy: 12, r: "2" }, { variants: "dot" }]]],\n'
      + '  ["path", { d: "M4 4h16" }, null],\n'
      + '], animations, { svg: true })',
    )
  })

  it('does not double a name that already ends in Icon', () => {
    const source = SOURCE.replaceAll('Sample', 'InfinityIcon')
    expect(iconDataFile('infinity', source).exportName).toBe('InfinityIcon')
  })

  it('refuses anything outside the template', () => {
    expect(() => iconDataFile('sample', SOURCE.replace('<path d="M4 4h16" />', '<text>A</text>'))).toThrow(/unsupported element <text>/)
    expect(() => iconDataFile('sample', SOURCE.replace('import * as React from \'react\';', 'import x from \'lodash\';'))).toThrow(/imports lodash/)
  })
})
