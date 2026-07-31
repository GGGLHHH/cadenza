import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// docs 自己的 cn:不能从 @gedatou/cadenza-ui 拿 —— 那是无 'use client'
// banner 的客户端 bundle,被 RSC(layout/mdx-components)导入会炸整个服务端图
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
