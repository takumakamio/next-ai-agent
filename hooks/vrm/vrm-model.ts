import type { Avatar as AvatarType } from '@/hooks/avatar'
import { AnimationPool, VRMMemoryMonitor } from '@/lib/vrm/utils'
import type { VRMAnimation } from '@/lib/vrm/vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type AnimationClip, AnimationMixer, type Group, LoopRepeat } from 'three'

export const useVRMModel = (
  avatar: AvatarType,
  getPreloadedData: any,
  cleanupVRM: () => void,
) => {
  const [isModelReady, setIsModelReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const loadedAvatarRef = useRef<string | null>(null)
  const vrmRef = useRef<VRM | null>(null)
  const sceneRef = useRef<Group | null>(null)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const animationsRef = useRef<{ [key: string]: AnimationClip }>({})
  const vrmAnimationsRef = useRef<{ [key: string]: VRMAnimation }>({})

  // Animation pooling and memory monitoring
  const animationPoolRef = useRef<AnimationPool | null>(null)
  const memoryMonitorRef = useRef<VRMMemoryMonitor | null>(null)

  // Initialize animation pool and memory monitor
  useEffect(() => {
    animationPoolRef.current = new AnimationPool({
      maxPoolSize: 50,
      disposeUnusedAfter: 60000,
      enableAutoCleanup: true,
    })

    memoryMonitorRef.current = new VRMMemoryMonitor()

    return () => {
      animationPoolRef.current?.dispose()
      animationPoolRef.current = null
      memoryMonitorRef.current = null
    }
  }, [])

  const loadModelFromPreloadedData = useCallback(
    async (
      avatarName: string,
      shouldOptimizePerformance: boolean,
      enableAnimations: boolean,
      reduceMotion: boolean,
      group: Group | null,
    ) => {
      console.log(`Loading model: ${avatarName}`)

      if (loadedAvatarRef.current === avatarName && vrmRef.current) {
        return
      }

      try {
        if (group && group.children.length > 0) {
          cleanupVRM()
        }

        const preloadedData = getPreloadedData(avatarName)

        if (preloadedData && group) {
          vrmRef.current = preloadedData.vrm
          sceneRef.current = preloadedData.scene

          loadedAvatarRef.current = avatarName

          const animationMixer = new AnimationMixer(preloadedData.scene)
          if (shouldOptimizePerformance) {
            animationMixer.timeScale = 0.8
          }
          mixerRef.current = animationMixer

          animationsRef.current = preloadedData.animations
          vrmAnimationsRef.current = preloadedData.vrmAnimations

          group.add(preloadedData.scene)
          setIsModelReady(true)

          // Auto-play idleLoop animation
          if (enableAnimations && preloadedData.animations['idleLoop']) {
            const action = animationMixer.clipAction(preloadedData.animations['idleLoop'])
            action.setLoop(2201, Number.POSITIVE_INFINITY)
            action.setEffectiveWeight(shouldOptimizePerformance ? 0.7 : 1.0)
            action.setEffectiveTimeScale(reduceMotion ? 0.5 : 1.0)
            action.enabled = !reduceMotion
            action.play()
          }
        } else {
          console.warn('No preloaded data available for:', avatarName)
          setIsModelReady(false)
        }
      } catch (error) {
        console.error('Error loading model:', error)
        setHasError(true)
        setIsModelReady(false)
      }
    },
    [cleanupVRM, getPreloadedData],
  )

  return {
    vrmRef,
    sceneRef,
    mixerRef,
    animationsRef,
    vrmAnimationsRef,
    isModelReady,
    hasError,
    setHasError,
    loadModelFromPreloadedData,
    loadedAvatarRef,
    animationPool: animationPoolRef.current,
    memoryMonitor: memoryMonitorRef.current,
  }
}
