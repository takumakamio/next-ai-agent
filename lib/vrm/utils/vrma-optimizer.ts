import type * as THREE from 'three'
import type { VRMAnimation } from '../vrm-animation'

/**
 * VRMA Optimizer - Amica-inspired animation optimization
 * Reduces animation file size and memory usage
 */

export interface VRMAOptimizationOptions {
  enableKeyframeReduction: boolean
  keyframeReductionTolerance: number
  enableTrackCompression: boolean
  removeRedundantTracks: boolean
  optimizeExpressionTracks: boolean
  maxKeyframes?: number
}

export const DEFAULT_VRMA_OPTIONS: VRMAOptimizationOptions = {
  enableKeyframeReduction: true,
  keyframeReductionTolerance: 0.001, // Very small tolerance for quality
  enableTrackCompression: true,
  removeRedundantTracks: true,
  optimizeExpressionTracks: true,
  maxKeyframes: 1000, // Limit per track
}

/**
 * Optimize a VRM animation for better performance
 */
export function optimizeVRMAnimation(
  animation: VRMAnimation,
  options: Partial<VRMAOptimizationOptions> = {},
): VRMAnimation {
  const opts = { ...DEFAULT_VRMA_OPTIONS, ...options }

  console.log('🎬 Optimizing VRMA animation...')

  let optimizations = 0

  // 1. Optimize humanoid rotation tracks
  if (opts.enableKeyframeReduction) {
    for (const [boneName, track] of animation.humanoidTracks.rotation.entries()) {
      const originalCount = track.times.length
      const optimizedTrack = optimizeKeyframes(track, opts.keyframeReductionTolerance, opts.maxKeyframes)

      if (optimizedTrack.times.length < originalCount) {
        animation.humanoidTracks.rotation.set(boneName, optimizedTrack)
        optimizations++
        console.log(
          `  ✓ ${boneName}: ${originalCount} → ${optimizedTrack.times.length} keyframes (${Math.round((1 - optimizedTrack.times.length / originalCount) * 100)}% reduction)`,
        )
      }
    }
  }

  // 2. Optimize humanoid translation tracks
  if (opts.enableKeyframeReduction) {
    for (const [boneName, track] of animation.humanoidTracks.translation.entries()) {
      const originalCount = track.times.length
      const optimizedTrack = optimizeKeyframes(track, opts.keyframeReductionTolerance, opts.maxKeyframes)

      if (optimizedTrack.times.length < originalCount) {
        animation.humanoidTracks.translation.set(boneName, optimizedTrack)
        optimizations++
      }
    }
  }

  // 3. Optimize expression tracks
  if (opts.optimizeExpressionTracks) {
    for (const [expressionName, track] of animation.expressionTracks.entries()) {
      const originalCount = track.times.length

      // Remove tracks that are always zero (unused expressions)
      if (opts.removeRedundantTracks && isTrackAlwaysZero(track)) {
        animation.expressionTracks.delete(expressionName)
        optimizations++
        console.log(`  ✓ Removed unused expression: ${expressionName}`)
        continue
      }

      // Optimize keyframes
      const optimizedTrack = optimizeKeyframes(track, opts.keyframeReductionTolerance, opts.maxKeyframes)

      if (optimizedTrack.times.length < originalCount) {
        animation.expressionTracks.set(expressionName, optimizedTrack)
        optimizations++
      }
    }
  }

  // 4. Optimize look-at track
  if (animation.lookAtTrack && opts.enableKeyframeReduction) {
    const originalCount = animation.lookAtTrack.times.length
    const optimizedTrack = optimizeKeyframes(animation.lookAtTrack, opts.keyframeReductionTolerance, opts.maxKeyframes)

    if (optimizedTrack.times.length < originalCount) {
      animation.lookAtTrack = optimizedTrack
      optimizations++
    }
  }

  console.log(`✅ VRMA optimization complete: ${optimizations} tracks optimized`)

  return animation
}

/**
 * Optimize keyframes in a track using Douglas-Peucker-like algorithm
 */
function optimizeKeyframes<T extends THREE.KeyframeTrack>(track: T, tolerance: number, maxKeyframes?: number): T {
  const times = Array.from(track.times)
  const values = Array.from(track.values)

  if (times.length <= 2) return track

  const valueSize = track.getValueSize()
  const optimizedIndices: number[] = [0] // Always keep first keyframe

  // Douglas-Peucker algorithm for keyframe reduction
  const douglasPeucker = (startIdx: number, endIdx: number) => {
    if (endIdx - startIdx <= 1) return

    let maxDistance = 0
    let maxIndex = startIdx

    // Find the point with maximum distance from line segment
    for (let i = startIdx + 1; i < endIdx; i++) {
      const distance = getKeyframeDistance(times, values, valueSize, startIdx, endIdx, i)

      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      douglasPeucker(startIdx, maxIndex)
      optimizedIndices.push(maxIndex)
      douglasPeucker(maxIndex, endIdx)
    }
  }

  douglasPeucker(0, times.length - 1)
  optimizedIndices.push(times.length - 1) // Always keep last keyframe

  // Sort indices
  optimizedIndices.sort((a, b) => a - b)

  // Apply max keyframes limit if specified
  let finalIndices = optimizedIndices
  if (maxKeyframes && optimizedIndices.length > maxKeyframes) {
    // Keep evenly distributed keyframes
    const step = optimizedIndices.length / maxKeyframes
    finalIndices = Array.from({ length: maxKeyframes }, (_, i) => optimizedIndices[Math.floor(i * step)])
    // Always keep first and last
    if (!finalIndices.includes(0)) finalIndices.unshift(0)
    if (!finalIndices.includes(times.length - 1)) finalIndices.push(times.length - 1)
  }

  // Build optimized arrays
  const optimizedTimes = finalIndices.map((i) => times[i])
  const optimizedValues: number[] = []

  for (const idx of finalIndices) {
    for (let j = 0; j < valueSize; j++) {
      optimizedValues.push(values[idx * valueSize + j])
    }
  }

  // Clone and update track
  const optimizedTrack = track.clone() as T
  optimizedTrack.times = new Float32Array(optimizedTimes)
  optimizedTrack.values = new Float32Array(optimizedValues)

  return optimizedTrack
}

/**
 * Calculate distance of a keyframe from the line segment between two other keyframes
 */
function getKeyframeDistance(
  times: number[],
  values: number[],
  valueSize: number,
  startIdx: number,
  endIdx: number,
  testIdx: number,
): number {
  const t0 = times[startIdx]
  const t1 = times[endIdx]
  const t = times[testIdx]

  // Interpolation factor
  const alpha = (t - t0) / (t1 - t0)

  let distance = 0

  // Calculate interpolated value and distance
  for (let i = 0; i < valueSize; i++) {
    const v0 = values[startIdx * valueSize + i]
    const v1 = values[endIdx * valueSize + i]
    const vTest = values[testIdx * valueSize + i]

    // Linear interpolation
    const vInterpolated = v0 + alpha * (v1 - v0)

    // Distance (can be euclidean or absolute depending on track type)
    distance += Math.abs(vTest - vInterpolated)
  }

  return distance / valueSize
}

/**
 * Check if a track is always zero (unused)
 */
function isTrackAlwaysZero(track: THREE.NumberKeyframeTrack): boolean {
  const threshold = 0.001

  for (let i = 0; i < track.values.length; i++) {
    if (Math.abs(track.values[i]) > threshold) {
      return false
    }
  }

  return true
}

/**
 * Get animation statistics
 */
export function getAnimationStats(animation: VRMAnimation): {
  duration: number
  rotationTracks: number
  translationTracks: number
  expressionTracks: number
  totalKeyframes: number
  estimatedSize: number
} {
  let totalKeyframes = 0

  // Count rotation keyframes
  for (const track of animation.humanoidTracks.rotation.values()) {
    totalKeyframes += track.times.length
  }

  // Count translation keyframes
  for (const track of animation.humanoidTracks.translation.values()) {
    totalKeyframes += track.times.length
  }

  // Count expression keyframes
  for (const track of animation.expressionTracks.values()) {
    totalKeyframes += track.times.length
  }

  // Count look-at keyframes
  if (animation.lookAtTrack) {
    totalKeyframes += animation.lookAtTrack.times.length
  }

  // Estimate size (rough approximation)
  const estimatedSize = totalKeyframes * 20 // ~20 bytes per keyframe

  return {
    duration: animation.duration,
    rotationTracks: animation.humanoidTracks.rotation.size,
    translationTracks: animation.humanoidTracks.translation.size,
    expressionTracks: animation.expressionTracks.size,
    totalKeyframes,
    estimatedSize,
  }
}

/**
 * Batch optimize multiple animations
 */
export function batchOptimizeAnimations(
  animations: Map<string, VRMAnimation>,
  options: Partial<VRMAOptimizationOptions> = {},
): Map<string, VRMAnimation> {
  console.log(`🎬 Batch optimizing ${animations.size} animations...`)

  const optimized = new Map<string, VRMAnimation>()
  let totalBefore = 0
  let totalAfter = 0

  for (const [name, animation] of animations.entries()) {
    const statsBefore = getAnimationStats(animation)
    totalBefore += statsBefore.totalKeyframes

    const optimizedAnimation = optimizeVRMAnimation(animation, options)
    optimized.set(name, optimizedAnimation)

    const statsAfter = getAnimationStats(optimizedAnimation)
    totalAfter += statsAfter.totalKeyframes
  }

  const reduction = Math.round((1 - totalAfter / totalBefore) * 100)
  console.log(`✅ Batch optimization complete: ${totalBefore} → ${totalAfter} keyframes (${reduction}% reduction)`)

  return optimized
}

/**
 * Create optimized animation clip for better performance
 */
export function createOptimizedClip(animation: VRMAnimation, vrm: any, name: string): THREE.AnimationClip {
  const clip = animation.createAnimationClip(vrm)

  // Set clip properties for better performance
  clip.name = name
  clip.optimize() // Three.js built-in optimization

  return clip
}
