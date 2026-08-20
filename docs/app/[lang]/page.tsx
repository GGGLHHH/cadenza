import { redirect } from 'next/navigation'
import { localizedHref } from '@/lib/i18n'

export default async function Home(props: {
  params: Promise<{ lang: string }>
}): Promise<never> {
  const { lang } = await props.params
  redirect(localizedHref(lang, '/docs'))
}
