import { type Avatar as AvatarType, useAvatar } from '@/hooks/avatar'
import {
  ANIMATION_CONFIG,
  ANIMATION_STATES,
  type AnimationState,
  VRM_EXPRESSIONS,
  useAnimationPlayer,
  useAnimationState,
  useExpressionBatcher,
  useExpressionManager,
  useIdleAnimation,
  useLipSync,
  useLipSyncHandler,
  useNaturalPose,
  usePerformanceMonitor,
  useVRMModel,
  useVRMPreloader,
} from '@/hooks/vrm'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { type JSX, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'

// Types
interface AvatarProps {
  avatar: AvatarType
  scale?: number
  rotation?: [number, number, number]
  position?: [number, number, number]
  reduceMotion?: boolean
  performanceMode?: boolean
  enableLipSync?: boolean
  enableAnimations?: boolean
  enableExpressions?: boolean
  idleAnimationTimeout?: number
  enableIdleAnimation?: boolean
}

// Error component
const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <Html position-y={1.6}>
    <div className="flex flex-col items-center -translate-x-1/2 p-4 bg-red-100 dark:bg-red-900 rounded-lg border border-red-300 dark:border-red-700">
      <span className="text-red-700 dark:text-red-300 text-sm font-medium mb-2">Unable to load 3D avatar</span>
      <button
        onClick={onRetry}
        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
      >
        Retry
      </button>
    </div>
  </Html>
)

// Loading component
const LoadingIndicator = ({
  avatar,
  isPreloading,
  preloadProgress,
  isAvatarPreloaded,
  thinkingText,
  reduceMotion,
  isInIdleMode,
}: {
  avatar: AvatarType
  isPreloading: boolean
  preloadProgress: Record<string, number>
  isAvatarPreloaded: (avatar: AvatarType) => boolean
  thinkingText: string
  reduceMotion: boolean
  isInIdleMode: boolean
}) => {
  return (
    <Html position-y={avatar === 'Tsumugi' ? 1.6 : 1.8}>
      <div className="flex justify-center items-center -translate-x-1/2">
        <span
          className="relative flex h-8 w-8 items-center justify-center"
          aria-label={
            isPreloading
              ? `Loading avatar: ${Math.round(preloadProgress[avatar] || 0)}%`
              : isInIdleMode
                ? 'Avatar is in idle mode'
                : 'Avatar is thinking'
          }
        >
          <span
            className={`absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${
              reduceMotion ? '' : 'animate-ping'
            }`}
          />
          <span className="relative inline-flex items-center justify-center duration-75 rounded-full h-8 w-8 bg-blue-400/80 text-white text-xs font-medium">
            {isPreloading && !isAvatarPreloaded(avatar)
              ? Math.round(preloadProgress[avatar] || 0) + '%'
              : thinkingText}
          </span>
        </span>
      </div>
    </Html>
  )
}

// Main Avatar component
export function Avatar({
  avatar,
  reduceMotion = false,
  performanceMode = false,
  enableLipSync = true,
  enableAnimations = true,
  enableExpressions = true,
  idleAnimationTimeout = 10000,
  enableIdleAnimation = true,
  ...props
}: AvatarProps): JSX.Element {
  const group = useRef<Group>(null)
  const frameSkipCounter = useRef(0)

  // Hooks
  const { isLowPerformance } = usePerformanceMonitor()
  const shouldOptimizePerformance = performanceMode || isLowPerformance

  const { getPreloadedData, isAvatarPreloaded, isPreloading, preloadProgress } = useVRMPreloader()
  const { audioContextRef, initializeAudio, cleanup: cleanupAudio } = useLipSync(enableLipSync)

  const animationState = useAnimationState()
  const currentMessage = useAvatar((state) => state.currentMessage)
  const loading = useAvatar((state) => state.loading)
  const loadingTTS = useAvatar((state) => state.loadingTTS)

  // Cleanup function
  const cleanupVRM = useCallback(() => {
    try {
      if (vrmModel.mixerRef.current) {
        vrmModel.mixerRef.current.stopAllAction()
        vrmModel.mixerRef.current.uncacheRoot(vrmModel.mixerRef.current.getRoot())
        vrmModel.mixerRef.current = null
      }

      if (animationState.currentActionRef.current) {
        animationState.currentActionRef.current.stop()
        animationState.currentActionRef.current = null
      }

      if (group.current) {
        group.current.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: any) => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        })

        while (group.current.children.length > 0) {
          group.current.remove(group.current.children[0])
        }
      }

      vrmModel.vrmRef.current = null
      vrmModel.sceneRef.current = null
      vrmModel.animationsRef.current = {}
      vrmModel.vrmAnimationsRef.current = {}
      animationState.currentAnimationStateRef.current = 'THINKING'

      if (window.gc) window.gc()
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }, [])

  const vrmModel = useVRMModel(avatar, getPreloadedData, cleanupVRM)

  // Initialize expression batcher for optimized expression updates
  const { batcher, blinkController } = useExpressionBatcher(vrmModel, enableExpressions)

  const {
    idleStateRef,
    trackUserActivity,
    startIdleSequence,
    getNextIdleAnimation,
    shouldStartIdle,
    shouldUpdateIdleAnimation,
  } = useIdleAnimation(enableIdleAnimation, idleAnimationTimeout, shouldOptimizePerformance)

  const currentExpressionRef = useExpressionManager(
    enableExpressions,
    loading,
    loadingTTS,
    animationState.isSpeaking,
    currentMessage,
    idleStateRef.current.isInIdleMode,
  )

  const { applyNaturalPose, applyEmergencyPose } = useNaturalPose(vrmModel)
  const { playAnimation } = useAnimationPlayer(
    vrmModel,
    animationState,
    enableAnimations,
    reduceMotion,
    shouldOptimizePerformance,
    applyNaturalPose,
  )
  const applyLipSync = useLipSyncHandler(vrmModel, currentMessage, enableLipSync, animationState.isSpeaking)

  const throttledAnimationUpdate = useMemo(() => {
    let lastUpdate = 0
    return (targetAnimation: AnimationState) => {
      const now = Date.now()
      const throttleTime = shouldOptimizePerformance
        ? ANIMATION_CONFIG.THROTTLE_PERFORMANCE
        : ANIMATION_CONFIG.THROTTLE_NORMAL

      if (now - lastUpdate < throttleTime) return
      lastUpdate = now

      if (targetAnimation !== animationState.currentAnimationStateRef.current) {
        applyEmergencyPose()

        // Small delay to ensure pose is applied
        setTimeout(() => {
          playAnimation(targetAnimation)
          animationState.currentAnimationStateRef.current = targetAnimation
        }, 16)
      }
    }
  }, [shouldOptimizePerformance, playAnimation, animationState.currentAnimationStateRef, applyEmergencyPose])

  // Animation state update logic
  const updateAnimationState = useCallback(() => {
    if (!enableAnimations || !vrmModel.mixerRef.current || !vrmModel.animationsRef.current || !vrmModel.isModelReady) {
      return
    }

    let targetAnimation: AnimationState = 'IDLE'

    if (loading || loadingTTS) {
      targetAnimation = 'THINKING'
      trackUserActivity()
    } else if (currentMessage) {
      if (animationState.isSpeaking) {
        targetAnimation = 'IDLE'
      }
      trackUserActivity()
    } else if (idleStateRef.current.isInIdleMode && enableIdleAnimation) {
      if (shouldUpdateIdleAnimation()) {
        targetAnimation = getNextIdleAnimation()
        const nextDelay = shouldOptimizePerformance ? 5000 : 3000 + Math.random() * 5000
        idleStateRef.current.nextAnimationTime = Date.now() + nextDelay
      } else {
        targetAnimation = animationState.currentAnimationStateRef.current || 'IDLE'
      }
    } else if (shouldStartIdle()) {
      startIdleSequence()
      targetAnimation = getNextIdleAnimation()
    }

    throttledAnimationUpdate(targetAnimation)
  }, [
    enableAnimations,
    enableIdleAnimation,
    loading,
    loadingTTS,
    currentMessage,
    animationState.isSpeaking,
    vrmModel.isModelReady,
    vrmModel.mixerRef,
    vrmModel.animationsRef,
    trackUserActivity,
    shouldStartIdle,
    shouldUpdateIdleAnimation,
    startIdleSequence,
    getNextIdleAnimation,
    throttledAnimationUpdate,
  ])

  // Initialize natural animation
  const initializeNaturalAnimation = useCallback(() => {
    if (!vrmModel.mixerRef.current || !vrmModel.animationsRef.current || !enableAnimations) return

    try {
      const availableAnimations = Object.keys(vrmModel.animationsRef.current)
      let initialAnimation: AnimationState = 'IDLE'

      if (vrmModel.animationsRef.current[ANIMATION_STATES.IDLE]) {
        initialAnimation = 'IDLE'
      } else if (vrmModel.animationsRef.current[ANIMATION_STATES.THINKING]) {
        initialAnimation = 'THINKING'
      } else if (availableAnimations.length > 0) {
        const firstAvailableClipName = availableAnimations[0]
        for (const [state, clipName] of Object.entries(ANIMATION_STATES)) {
          if (clipName === firstAvailableClipName) {
            initialAnimation = state as AnimationState
            break
          }
        }
      }

      // Apply natural pose first as base
      applyNaturalPose()
    } catch (error) {
      console.error('Error initializing natural animation:', error)
      applyNaturalPose()
    }
  }, [vrmModel.mixerRef, vrmModel.animationsRef, enableAnimations, playAnimation, applyNaturalPose])

  // Main effect for state management
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = []

    // Track user activity
    if (currentMessage || loading || loadingTTS) {
      trackUserActivity()
    }

    // Initialize audio
    if (enableLipSync) {
      const audioInitialized = initializeAudio()
      if (!audioInitialized) {
        vrmModel.setHasError(true)
      } else {
        cleanupFunctions.push(cleanupAudio)
      }
    }

    // Load model
    if (vrmModel.loadedAvatarRef.current !== avatar || !vrmModel.vrmRef.current) {
      vrmModel.loadModelFromPreloadedData(
        avatar,
        shouldOptimizePerformance,
        enableAnimations,
        reduceMotion,
        group.current,
      )

      setTimeout(() => {
        if (vrmModel.vrmRef.current) {
          initializeNaturalAnimation()
        }
      }, 500)
    }

    // Handle preloading completion
    if (!isPreloading && !vrmModel.vrmRef.current && avatar && !vrmModel.hasError) {
      vrmModel.loadModelFromPreloadedData(
        avatar,
        shouldOptimizePerformance,
        enableAnimations,
        reduceMotion,
        group.current,
      )

      setTimeout(() => {
        if (vrmModel.vrmRef.current) {
          initializeNaturalAnimation()
        }
      }, 500)
    }

    // Setup thinking animation
    if (loading || loadingTTS) {
      const interval = setInterval(
        () => {
          animationState.setThinkingText((prev) => (prev.length === 3 ? '.' : prev + '.'))
        },
        reduceMotion ? 1000 : 500,
      )
      cleanupFunctions.push(() => clearInterval(interval))
    }

    // Setup idle animation timer
    if (enableIdleAnimation && !loading && !loadingTTS && !animationState.isSpeaking) {
      idleStateRef.current.timer = setTimeout(() => {
        startIdleSequence()
      }, idleAnimationTimeout)

      cleanupFunctions.push(() => {
        if (idleStateRef.current.timer) {
          clearTimeout(idleStateRef.current.timer)
          idleStateRef.current.timer = null
        }
      })
    }

    // Setup audio event listeners
    if (enableLipSync && currentMessage?.audioPlayer) {
      const audio = currentMessage.audioPlayer

      const handlePlay = () => {
        animationState.setIsSpeaking(true)
        trackUserActivity()
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume()
        }
      }

      const handlePause = () => {
        animationState.setIsSpeaking(false)
        trackUserActivity()
      }

      const handleEnded = () => {
        animationState.setIsSpeaking(false)
        trackUserActivity()
      }

      // Setup event listeners
      if (audio.addEventListener) {
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)
      } else {
        audio.onplay = handlePlay
        audio.onpause = handlePause
        audio.onended = handleEnded
      }

      if (audio.currentTime !== undefined && !audio.paused && !audio.ended) {
        animationState.setIsSpeaking(true)
      }

      cleanupFunctions.push(() => {
        if (audio.removeEventListener) {
          audio.removeEventListener('play', handlePlay)
          audio.removeEventListener('pause', handlePause)
          audio.removeEventListener('ended', handleEnded)
        }
        animationState.setIsSpeaking(false)
      })
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [
    avatar,
    enableLipSync,
    enableAnimations,
    enableIdleAnimation,
    idleAnimationTimeout,
    reduceMotion,
    shouldOptimizePerformance,
    loading,
    loadingTTS,
    currentMessage,
    isPreloading,
    vrmModel.hasError,
    animationState.isSpeaking,
    trackUserActivity,
    startIdleSequence,
    initializeNaturalAnimation,
  ])

  // Update animation state when dependencies change
  useEffect(() => {
    updateAnimationState()
  }, [updateAnimationState])

  // Frame loop
  useFrame((_, delta) => {
    if (!vrmModel.vrmRef.current || !vrmModel.isModelReady) return

    // Performance optimization
    if (shouldOptimizePerformance) {
      frameSkipCounter.current++
      if (frameSkipCounter.current % 2 !== 0) return
    }

    // Check for idle animation updates
    if (shouldUpdateIdleAnimation()) {
      updateAnimationState()
    }

    try {
      // Update animation mixer
      if (vrmModel.mixerRef.current && enableAnimations) {
        const timeScale = reduceMotion
          ? ANIMATION_CONFIG.TIMESCALE_REDUCED
          : shouldOptimizePerformance
            ? ANIMATION_CONFIG.TIMESCALE_PERFORMANCE
            : 1.0
        vrmModel.mixerRef.current.update(delta * timeScale)
      }

      // Apply natural pose fallback
      if (!vrmModel.mixerRef.current && vrmModel.vrmRef.current?.humanoid) {
        const frameCount = Math.floor(Date.now() / 100)
        if (frameCount % 60 === 0) {
          applyNaturalPose()
        }
      }

      if (!vrmModel.vrmRef.current?.expressionManager || !enableExpressions) {
        // Still need to update VRM even without expressions
        if (vrmModel.vrmRef.current) {
          vrmModel.vrmRef.current.update(delta)
        }
        return
      }

      // Use expression batcher for optimized updates
      if (batcher) {
        // Reset expressions
        Object.values(VRM_EXPRESSIONS).forEach((expression) => {
          batcher.queueUpdate(expression, 0)
        })

        // Apply base expression
        const baseIntensity = animationState.isSpeaking
          ? 0.4
          : idleStateRef.current.isInIdleMode
            ? shouldOptimizePerformance
              ? 0.5
              : 0.7
            : shouldOptimizePerformance
              ? 0.7
              : 0.9

        batcher.queueUpdate(currentExpressionRef.current, baseIntensity)

        // Apply natural blinking if enabled
        if (blinkController) {
          const blinkIntensity = blinkController.update()
          if (blinkIntensity > 0) {
            batcher.queueUpdate('blink', blinkIntensity, 15) // High priority
          }
        }

        // Apply lip sync
        applyLipSync()

        // Flush batched updates
        batcher.flush()
      } else {
        // Fallback to direct updates if batcher not available
        Object.values(VRM_EXPRESSIONS).forEach((expression) => {
          try {
            vrmModel.vrmRef.current?.expressionManager?.setValue(expression, 0)
          } catch (e) {
            console.error('Expression error:', e)
          }
        })

        const baseIntensity = animationState.isSpeaking ? 0.4 : 0.9

        try {
          vrmModel.vrmRef.current.expressionManager.setValue(currentExpressionRef.current, baseIntensity)
        } catch (e) {
          console.error('Expression error:', e)
        }

        applyLipSync()
      }

      // Monitor memory periodically (1% of frames)
      if (vrmModel.memoryMonitor && Math.random() < 0.01) {
        vrmModel.memoryMonitor.sample()
        const stats = vrmModel.memoryMonitor.getStats()
        if (stats.isLeaking) {
          console.warn('Potential memory leak detected!', stats)
        }
      }

      vrmModel.vrmRef.current.expressionManager.update()
      vrmModel.vrmRef.current.update(delta)
    } catch (error) {
      console.error('Frame update error:', error)
    }
  })

  // Render states
  const showLoadingState =
    loading || loadingTTS || !vrmModel.isModelReady || (isPreloading && !isAvatarPreloaded(avatar))

  const handleRetry = useCallback(() => {
    vrmModel.setHasError(false)
    vrmModel.loadModelFromPreloadedData(
      avatar,
      shouldOptimizePerformance,
      enableAnimations,
      reduceMotion,
      group.current,
    )
  }, [avatar, shouldOptimizePerformance, enableAnimations, reduceMotion, vrmModel])

  if (vrmModel.hasError) {
    return (
      <group {...props} dispose={null} ref={group}>
        <ErrorFallback onRetry={handleRetry} />
      </group>
    )
  }

  return (
    <group
      {...props}
      dispose={null}
      ref={group}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      raycast={() => null}
    >
      {showLoadingState && (
        <LoadingIndicator
          avatar={avatar}
          isPreloading={isPreloading}
          preloadProgress={preloadProgress}
          isAvatarPreloaded={isAvatarPreloaded}
          thinkingText={animationState.thinkingText}
          reduceMotion={reduceMotion}
          isInIdleMode={idleStateRef.current.isInIdleMode}
        />
      )}
    </group>
  )
}
