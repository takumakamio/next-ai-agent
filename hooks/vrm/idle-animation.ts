import { useCallback, useRef } from 'react'
import type { AnimationState } from './animation-state'

interface IdleState {
  isInIdleMode: boolean
  animationIndex: number
  nextAnimationTime: number
  timer: NodeJS.Timeout | null
}

const IDLE_ANIMATION_SEQUENCE: AnimationState[] = [
  'IDLE',
  'THINKING',
  'GREETING',
  'EXPLAINING',
  'POINTING',
  'WELCOMING',
  'PRESENTING',
  'RECOMMENDING',
  'CONFIRMING',
]

export const useIdleAnimation = (
  enableIdleAnimation: boolean,
  idleAnimationTimeout: number,
  shouldOptimizePerformance: boolean,
) => {
  const idleStateRef = useRef<IdleState>({
    isInIdleMode: false,
    animationIndex: 0,
    nextAnimationTime: 0,
    timer: null,
  })
  const lastUserActivityRef = useRef<number>(Date.now())

  const trackUserActivity = useCallback(() => {
    lastUserActivityRef.current = Date.now()
    idleStateRef.current.isInIdleMode = false

    if (idleStateRef.current.timer) {
      clearTimeout(idleStateRef.current.timer)
      idleStateRef.current.timer = null
    }
  }, [])

  const startIdleSequence = useCallback(() => {
    if (!enableIdleAnimation) return

    idleStateRef.current.isInIdleMode = true
    const nextDelay = shouldOptimizePerformance ? 5000 : 3000 + Math.random() * 5000
    idleStateRef.current.nextAnimationTime = Date.now() + nextDelay
  }, [enableIdleAnimation, shouldOptimizePerformance])

  const getNextIdleAnimation = useCallback((): AnimationState => {
    // Randomly select an animation from the sequence
    const randomIndex = Math.floor(Math.random() * IDLE_ANIMATION_SEQUENCE.length)
    idleStateRef.current.animationIndex = randomIndex
    return IDLE_ANIMATION_SEQUENCE[randomIndex]
  }, [])

  const shouldStartIdle = useCallback(() => {
    return (
      enableIdleAnimation &&
      !idleStateRef.current.isInIdleMode &&
      Date.now() - lastUserActivityRef.current > idleAnimationTimeout
    )
  }, [enableIdleAnimation, idleAnimationTimeout])

  const shouldUpdateIdleAnimation = useCallback(() => {
    return idleStateRef.current.isInIdleMode && Date.now() >= idleStateRef.current.nextAnimationTime
  }, [])

  return {
    idleStateRef,
    trackUserActivity,
    startIdleSequence,
    getNextIdleAnimation,
    shouldStartIdle,
    shouldUpdateIdleAnimation,
  }
}
