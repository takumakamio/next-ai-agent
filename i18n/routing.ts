import { DEFAULT_LOCALE } from '@/lib/constants'
import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export const LANGUAGE_CONFIG = {
  ja: { name: '日本語', flag: '🇯🇵' },
  en: { name: 'English', flag: '🇺🇸' },
} as const

export type Language = keyof typeof LANGUAGE_CONFIG
export type LanguageMetadata = (typeof LANGUAGE_CONFIG)[Language]
export type LanguageOption = {
  code: Language
  name: string
  flag: string
}

export const SUPPORTED_LOCALES = Object.keys(LANGUAGE_CONFIG) as Language[]
export const LANGUAGES = SUPPORTED_LOCALES.map((code) => ({
  code,
  ...LANGUAGE_CONFIG[code],
}))

export function getLanguageName(locale: string): string {
  if (isValidLanguage(locale)) {
    return LANGUAGE_CONFIG[locale].name
  }
  return LANGUAGE_CONFIG[DEFAULT_LOCALE as Language]?.name || 'English'
}
export function isValidLanguage(locale: string): locale is Language {
  return locale in LANGUAGE_CONFIG
}

export function getLanguageMetadata(locale: string): LanguageMetadata | null {
  return isValidLanguage(locale) ? LANGUAGE_CONFIG[locale] : null
}

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'never',
  localeDetection: false,
})

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
