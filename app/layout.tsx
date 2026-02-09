import '@/styles/globals.css'
import { Providers } from '@/components/providers'
import { getLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import type React from 'react'

// export async function generateMetadata({ params }: { params: { locale: Locale } }) {
//   const { locale } = await params
//   const t = await getTranslations({ locale, namespace: 'Root.Metadata' })
//   const validLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
//   return {
//     title: t('title'),
//     description: t('description'),
//     openGraph: {
//       title: t('title'),
//       description: t('description'),
//       images: ['/logo.jpg'],
//       locale: validLocale,
//       url: `${ROOT_URL}`,
//       type: 'website',
//       siteName: t('title'),
//     },
//     twitter: {
//       title: t('title'),
//       description: t('description'),
//       card: 'summary',
//       creator: '@next-ai-agent',
//       images: ['/logo.jpg'],
//     },
//     metadataBase: new URL(ROOT_URL),
//   }
// }

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>): Promise<React.ReactElement> {
  const locale = await getLocale()

  return (
    <html lang={locale} className="dark">
      <body className={`antialiased min-h-dvh w-dvw w-full text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
