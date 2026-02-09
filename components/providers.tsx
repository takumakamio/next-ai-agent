import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider>
      <Toaster theme="dark" />
      {children}
    </NextIntlClientProvider>
  )
}
