import { useCallback } from 'react'
import { LoopOnce, LoopRepeat } from 'three'
import { ANIMATION_STATES, type AnimationState } from './animation-state'

export const ANIMATION_CONFIG = {
  FADE_DURATION: 0.5, // Amica uses 0.5s for smoother transitions
  FADE_OUT_DURATION: 1.0, // Dedicated fade-out duration (Amica pattern)
  WEIGHT_IDLE: 0.7,
  WEIGHT_NORMAL: 1.0,
  WEIGHT_PERFORMANCE: 0.8,
  TIMESCALE_REDUCED: 0.5,
  TIMESCALE_PERFORMANCE: 0.9,
  TIMESCALE_IDLE: 0.8,
  THROTTLE_NORMAL: 200,
  THROTTLE_PERFORMANCE: 500,
}

/**
 * Animation player based on Amica's animation system
 * Key improvements:
 * - Separate fade-in/fade-out instead of just crossfade
 * - Event handling for finished animations
 * - Better loop mode management
 * - Cleaner action transitions
 */
export const useAnimationPlayer = (
  vrmModel: any,
  animationState: any,
  enableAnimations: boolean,
  reduceMotion: boolean,
  shouldOptimizePerformance: boolean,
  applyNaturalPose: () => void,
) => {
  /**
   * Fade to a new action (Amica's fadeToAction pattern)
   * This provides smoother transitions than simple crossfade
   */
  const fadeToAction = useCallback(
    (targetAnimationState: AnimationState, fadeDuration: number = ANIMATION_CONFIG.FADE_DURATION) => {
      if (!vrmModel.mixerRef.current || !vrmModel.animationsRef.current || !enableAnimations) {
        applyNaturalPose()
        return
      }

      const animationName = ANIMATION_STATES[targetAnimationState]
      const clip = vrmModel.animationsRef.current[animationName]

      if (!clip) {
        applyNaturalPose()
        return
      }

      try {
        console.log(`🎬 Fading to animation: ${targetAnimationState} (${animationName})`)

        const previousAction = animationState.currentActionRef.current
        const newAction = vrmModel.mixerRef.current.clipAction(clip)

        // Reset and configure new action
        newAction.reset()
        newAction.setEffectiveTimeScale(
          reduceMotion
            ? ANIMATION_CONFIG.TIMESCALE_REDUCED
            : shouldOptimizePerformance
              ? ANIMATION_CONFIG.TIMESCALE_PERFORMANCE
              : 1.0,
        )
        newAction.setEffectiveWeight(
          shouldOptimizePerformance ? ANIMATION_CONFIG.WEIGHT_PERFORMANCE : ANIMATION_CONFIG.WEIGHT_NORMAL,
        )

        // Set loop mode (idle animations loop, others might not)
        const isIdleAnimation = targetAnimationState === 'IDLE' || targetAnimationState === 'THINKING'
        newAction.setLoop(isIdleAnimation ? LoopRepeat : LoopRepeat, isIdleAnimation ? Number.POSITIVE_INFINITY : 1)
        newAction.clampWhenFinished = !isIdleAnimation

        newAction.enabled = true

        // Fade out previous action if it exists
        if (previousAction && previousAction !== newAction) {
          const fadeOutDuration = reduceMotion ? 0.1 : fadeDuration
          previousAction.fadeOut(fadeOutDuration)
        }

        // Fade in new action
        const fadeInDuration = reduceMotion ? 0.1 : fadeDuration
        newAction.fadeIn(fadeInDuration).play()

        animationState.currentActionRef.current = newAction
        console.log(`✅ Animation fade complete: ${targetAnimationState}`)
      } catch (error) {
        console.error('Animation fade error:', error)
        applyNaturalPose()
      }
    },
    [
      enableAnimations,
      reduceMotion,
      shouldOptimizePerformance,
      vrmModel.mixerRef,
      vrmModel.animationsRef,
      animationState.currentActionRef,
      applyNaturalPose,
    ],
  )

  /**
   * Play a one-shot animation that returns to idle when finished (Amica pattern)
   * Returns duration in seconds for timing coordination
   */
  const playOneShotAnimation = useCallback(
    (targetAnimationState: AnimationState): number => {
      if (!vrmModel.mixerRef.current || !vrmModel.animationsRef.current || !enableAnimations) {
        return 0
      }

      const animationName = ANIMATION_STATES[targetAnimationState]
      const clip = vrmModel.animationsRef.current[animationName]

      if (!clip) {
        return 0
      }

      try {
        console.log(`🎯 Playing one-shot animation: ${targetAnimationState} (${animationName})`)

        const mixer = vrmModel.mixerRef.current
        const idleAction = animationState.currentActionRef.current
        const oneShotAction = mixer.clipAction(clip)

        // Configure one-shot animation (Amica's approach)
        oneShotAction.reset()
        oneShotAction.setLoop(LoopOnce, 1)
        oneShotAction.clampWhenFinished = true
        oneShotAction.setEffectiveTimeScale(reduceMotion ? ANIMATION_CONFIG.TIMESCALE_REDUCED : 1.0)
        oneShotAction.setEffectiveWeight(ANIMATION_CONFIG.WEIGHT_NORMAL)

        // Fade out current action, fade in one-shot
        const fadeDuration = reduceMotion ? 0.1 : ANIMATION_CONFIG.FADE_DURATION
        if (idleAction) {
          idleAction.fadeOut(fadeDuration)
        }
        oneShotAction.fadeIn(fadeDuration).play()

        // Set up event listener to restore idle after completion (Amica pattern)
        const restoreIdle = () => {
          mixer.removeEventListener('finished', restoreIdle)
          if (idleAction) {
            const restoreDuration = reduceMotion ? 0.1 : ANIMATION_CONFIG.FADE_DURATION
            idleAction.reset().fadeIn(restoreDuration).play()
            animationState.currentActionRef.current = idleAction
            console.log('🔄 Restored idle animation after one-shot')
          }
        }

        mixer.addEventListener('finished', restoreIdle)

        // Calculate total duration (Amica returns this for coordination)
        // clip duration + fade out time + fade in time
        const totalDuration = clip.duration + ANIMATION_CONFIG.FADE_OUT_DURATION + ANIMATION_CONFIG.FADE_DURATION

        console.log(`✅ One-shot animation started, duration: ${totalDuration.toFixed(2)}s`)
        return totalDuration
      } catch (error) {
        console.error('One-shot animation error:', error)
        return 0
      }
    },
    [enableAnimations, reduceMotion, vrmModel.mixerRef, vrmModel.animationsRef, animationState.currentActionRef],
  )

  /**
   * Main play function - uses fadeToAction for smoother transitions (Amica pattern)
   */
  const playAnimation = useCallback(
    (targetAnimationState: AnimationState) => {
      fadeToAction(targetAnimationState)
    },
    [fadeToAction],
  )

  return { playAnimation, fadeToAction, playOneShotAnimation }
}
