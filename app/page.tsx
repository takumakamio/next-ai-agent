'use client'

import { HomeTabs } from '@/features/root/home/components/home-tabs'
import { useBackgroundStore } from '@/hooks/background'
import { useEffect } from 'react'

export default function Home() {
  const preset = useBackgroundStore((s) => s.preset)
  const hydrate = useBackgroundStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    document.documentElement.setAttribute('data-preset', preset)
    return () => document.documentElement.removeAttribute('data-preset')
  }, [preset])

  return (
    <>
      <div className={`bg-layer bg-${preset}`}>
        <div className="bg-layer-blob" />
        <div className="bg-layer-blob" />
        <div className="bg-layer-blob" />
        <div className="bg-layer-blob" />
        <div className="bg-layer-pattern" />
      </div>
      <div className="relative z-10">
        <HomeTabs />
      </div>
    </>
  )
}
