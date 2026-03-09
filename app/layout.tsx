import '@/styles/globals.css'
import { Providers } from '@/components/providers'
import type { ReactNode } from 'react'
import type React from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>): React.ReactElement {
  return (
    <html lang="ja" className="dark">
      <body className={`antialiased min-h-dvh w-dvw w-full text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
