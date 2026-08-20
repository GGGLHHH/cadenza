import { defineI18n } from 'fumadocs-core/i18n'

// 中文是默认语言且不带前缀(hideLocale):/docs/* 保持上线以来的 URL 不变,
// proxy 内部 rewrite 到 /zh/*;英文挂在 /en/* 下。内容文件走 dot 后缀
// (page.en.mdx 与 page.mdx 比邻),默认语言缺翻译时自动回落中文原文。
export const i18n = defineI18n({
  defaultLanguage: 'zh',
  languages: ['zh', 'en'],
  hideLocale: 'default-locale',
})

export type Locale = (typeof i18n.languages)[number]

/** 站内链接补语言前缀;默认语言不带前缀是 hideLocale 的约定,写死会被 proxy 弹回 */
export function localizedHref(lang: string, path: string): string {
  return lang === i18n.defaultLanguage ? path : `/${lang}${path}`
}

/** `<html lang>` 用 BCP 47 全称,路由段用短码,两套词形只在这换算 */
export function htmlLang(lang: string): string {
  return lang === 'zh' ? 'zh-CN' : 'en'
}
