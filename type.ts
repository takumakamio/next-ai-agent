import type { Locale } from 'next-intl'
import type { routing } from './i18n/routing'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
  }
}

export type Bindings = {
  locale: Locale
  requestId: string
}

export type PageProps = {
  params: Promise<{ id: string; locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export type PaginationData = {
  currentPage: number
  totalPages: number
  totalItems: number
  limit: number
}

export type Image = File | string

export type ImageFormat = 'avif' | 'webp' | 'jpg' | 'png'
