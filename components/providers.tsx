import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster theme="dark" />
      {children}
    </>
  )
}
