import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware'
import { i18n } from '@/lib/i18n'

// 语言协商与 rewrite/redirect 全部由 fumadocs 提供:
// 无前缀路径 rewrite 到默认语言(URL 不变),/zh/* 会被 redirect 回无前缀的规范形。
export default createI18nMiddleware(i18n)

export const config = {
  // 放过 API、Next 内部资源和一切带扩展名的静态文件(public/ 下的 favicon 等)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
