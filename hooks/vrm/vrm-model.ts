import type { Avatar as AvatarType, ModelFormat } from '@/hooks/avatar'
import { AnimationPool, VRMMemoryMonitor } from '@/lib/vrm/utils'
import type { VRMAnimation } from '@/lib/vrm/vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type AnimationClip, AnimationMixer, Box3, type Group, LoopRepeat, Vector3 } from 'three'

export const useVRMModel = (
  avatar: AvatarType,
  modelFormat: ModelFormat,
  getPreloadedData: any,
  cleanupVRM: () => void,
) => {
  const [isModelReady, setIsModelReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const loadedAvatarRef = useRef<string | null>(null)
  const modelFormatRef = useRef<ModelFormat>(modelFormat)
  const vrmRef = useRef<VRM | null>(null)
  const sceneRef = useRef<Group | null>(null)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const animationsRef = useRef<{ [key: string]: AnimationClip }>({})
  const vrmAnimationsRef = useRef<{ [key: string]: VRMAnimation }>({})

  // Animation pooling and memory monitoring
  const animationPoolRef = useRef<AnimationPool | null>(null)
  const memoryMonitorRef = useRef<VRMMemoryMonitor | null>(null)

  // Keep format ref in sync
  useEffect(() => {
    modelFormatRef.current = modelFormat
  }, [modelFormat])

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

  const isVRM = modelFormat === 'vrm'

  const loadModelFromPreloadedData = useCallback(
    async (
      avatarName: string,
      format: ModelFormat,
      shouldOptimizePerformance: boolean,
      enableAnimations: boolean,
      reduceMotion: boolean,
      group: Group | null,
    ) => {
      const modelKey = `${avatarName}-${format}`
      console.log(`Loading model: ${modelKey}`)

      if (loadedAvatarRef.current === modelKey && (vrmRef.current || sceneRef.current)) {
        return
      }

      try {
        if (group && group.children.length > 0) {
          cleanupVRM()
        }

        const preloadedData = getPreloadedData(avatarName, format)

        if (preloadedData && group) {
          modelFormatRef.current = format

          if (format === 'vrm' && preloadedData.vrm) {
            vrmRef.current = preloadedData.vrm
            sceneRef.current = preloadedData.scene
          } else {
            vrmRef.current = null
            sceneRef.current = preloadedData.scene
          }

          loadedAvatarRef.current = modelKey

          const animationMixer = new AnimationMixer(preloadedData.scene)
          if (shouldOptimizePerformance) {
            animationMixer.timeScale = 0.8
          }
          mixerRef.current = animationMixer

          animationsRef.current = preloadedData.animations
          vrmAnimationsRef.current = preloadedData.vrmAnimations

          // GLB models may be exported with a different up-axis; flip upright
          // then reposition so feet sit at y=0
          if (format === 'glb') {
            preloadedData.scene.rotation.y = Math.PI
            preloadedData.scene.updateMatrixWorld(true)
            const box = new Box3().setFromObject(preloadedData.scene)
            // Move scene so the bottom of the bounding box (feet) is at y=0
            preloadedData.scene.position.y = -box.min.y
          }

          group.add(preloadedData.scene)
          setIsModelReady(true)

          if (format === 'glb') {
            // GLB: start in static pose (no auto-play)
          } else {
            // For VRM: use existing idleLoop logic
            if (enableAnimations && preloadedData.animations['idleLoop']) {
              const action = animationMixer.clipAction(preloadedData.animations['idleLoop'])
              action.setLoop(2201, Number.POSITIVE_INFINITY)
              action.setEffectiveWeight(shouldOptimizePerformance ? 0.7 : 1.0)
              action.setEffectiveTimeScale(reduceMotion ? 0.5 : 1.0)
              action.enabled = !reduceMotion
              action.play()
            }
          }
        } else {
          console.warn('No preloaded data available for:', modelKey)
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
    isVRM,
    modelFormatRef,
    hasError,
    setHasError,
    loadModelFromPreloadedData,
    loadedAvatarRef,
    animationPool: animationPoolRef.current,
    memoryMonitor: memoryMonitorRef.current,
  }
}
