import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'

export const usePerformanceMonitor = () => {
  const [frameRate, setFrameRate] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useFrame(() => {
    frameCountRef.current++
    const now = performance.now()

    if (now - lastTimeRef.current >= 1000) {
      setFrameRate(frameCountRef.current)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return { frameRate, isLowPerformance: frameRate < 30 }
}
