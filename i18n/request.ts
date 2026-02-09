import { type Locale, hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { routing } from './routing'

export default getRequestConfig(async () => {
  // Get locale from cookie only (no URL-based locale)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

  // Validate and use cookie locale, or fall back to default
  const locale = (hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale) as Locale

  const messages = (await import(`@/i18n/locales/${locale}.json`)).default
  const output = Object.entries(messages).reduce((acc, [key, value]) => setDeepPath(acc, key, value), {})

  return {
    locale,
    messages: output,
  }
})

function setDeepPath(obj: any, path: string, value: any) {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return obj
}
