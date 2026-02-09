import type { VRM } from '@pixiv/three-vrm'

/**
 * Spring Bone Stabilizer
 * Prevents unwanted shaking/jiggling in VRM models
 * Particularly useful for bust physics that can be excessive
 */

export interface SpringBoneStabilizerOptions {
  disableBustPhysics: boolean
  disableAllPhysics: boolean
  reduceStiffness: boolean
  stiffnessMultiplier: number
  dragMultiplier: number
  targetBones?: string[]
}

export const DEFAULT_STABILIZER_OPTIONS: SpringBoneStabilizerOptions = {
  disableBustPhysics: true,
  disableAllPhysics: false,
  reduceStiffness: true,
  stiffnessMultiplier: 2.0, // Higher = less movement
  dragMultiplier: 1.5, // Higher = more damping
  targetBones: undefined,
}

// Common bone names that cause unwanted movement
const BUST_BONE_PATTERNS = ['bust']

/**
 * Stabilize spring bones to prevent shaking
 */
export function stabilizeSpringBones(vrm: VRM, options: Partial<SpringBoneStabilizerOptions> = {}): void {
  const opts = { ...DEFAULT_STABILIZER_OPTIONS, ...options }

  if (!vrm.springBoneManager) {
    console.log('⚠️ No spring bone manager found')
    return
  }

  console.log('🔧 Stabilizing spring bones...')

  const manager = vrm.springBoneManager
  let stabilizedCount = 0

  // Convert Set to Array for iteration
  const joints = Array.from(manager.joints)

  // Disable all physics if requested
  if (opts.disableAllPhysics) {
    joints.forEach((joint) => {
      joint.settings.stiffness = 1000 // Very stiff = no movement
      joint.settings.dragForce = 10 // High drag
    })
    stabilizedCount = joints.length
    console.log(`✅ Disabled all spring bone physics (${stabilizedCount} joints)`)
    return
  }

  // Process each spring bone joint
  joints.forEach((joint) => {
    const boneName = joint.bone?.name || ''

    // Check if this is a bust bone
    const isBustBone = BUST_BONE_PATTERNS.some(
      (pattern) => boneName.toLowerCase().includes(pattern.toLowerCase()) || boneName.includes(pattern),
    )

    // Check if this is a targeted bone
    const isTargeted =
      opts.targetBones?.some(
        (pattern) => boneName.toLowerCase().includes(pattern.toLowerCase()) || boneName.includes(pattern),
      ) ?? false

    const shouldStabilize = (opts.disableBustPhysics && isBustBone) || isTargeted

    if (shouldStabilize) {
      // Disable or heavily reduce movement
      joint.settings.stiffness = 1000 // Very stiff
      joint.settings.dragForce = 10 // High drag
      joint.settings.gravityPower = 0 // No gravity

      stabilizedCount++
      console.log(`  ✓ Stabilized: ${boneName}`)
    } else if (opts.reduceStiffness) {
      // Reduce movement for other bones
      joint.settings.stiffness *= opts.stiffnessMultiplier
      joint.settings.dragForce *= opts.dragMultiplier

      // Optionally reduce gravity effect
      if (joint.settings.gravityPower > 0) {
        joint.settings.gravityPower *= 0.5
      }
    }
  })

  if (stabilizedCount > 0) {
    console.log(`✅ Stabilized ${stabilizedCount} spring bone joints`)
  } else {
    console.log('✅ Spring bone parameters adjusted')
  }
}

/**
 * Disable spring bones completely
 */
export function disableSpringBones(vrm: VRM): void {
  stabilizeSpringBones(vrm, {
    disableAllPhysics: true,
  })
}

/**
 * Disable only bust physics
 */
export function disableBustPhysics(vrm: VRM): void {
  stabilizeSpringBones(vrm, {
    disableBustPhysics: true,
    disableAllPhysics: false,
  })
}

/**
 * Reduce spring bone movement (gentle approach)
 */
export function reduceSpringBoneMovement(vrm: VRM, amount = 2.0): void {
  stabilizeSpringBones(vrm, {
    disableBustPhysics: false,
    disableAllPhysics: false,
    reduceStiffness: true,
    stiffnessMultiplier: amount,
    dragMultiplier: amount * 0.75,
  })
}

/**
 * Disable specific bones by name patterns
 */
export function disableSpecificBones(vrm: VRM, bonePatterns: string[]): void {
  stabilizeSpringBones(vrm, {
    disableBustPhysics: false,
    disableAllPhysics: false,
    targetBones: bonePatterns,
  })
}

/**
 * Get list of all spring bone names for debugging
 */
export function getSpringBoneNames(vrm: VRM): string[] {
  if (!vrm.springBoneManager) {
    return []
  }

  const joints = Array.from(vrm.springBoneManager.joints)
  return joints.map((joint) => joint.bone?.name || 'Unknown').filter((name) => name !== 'Unknown')
}

/**
 * Print spring bone information
 */
export function printSpringBoneInfo(vrm: VRM): void {
  if (!vrm.springBoneManager) {
    console.log('No spring bone manager')
    return
  }

  const manager = vrm.springBoneManager
  const joints = Array.from(manager.joints)
  console.log('🦴 Spring Bone Information:')
  console.log(`  Total joints: ${joints.length}`)

  joints.forEach((joint, index) => {
    const boneName = joint.bone?.name || 'Unknown'
    console.log(`  [${index}] ${boneName}:`, {
      stiffness: joint.settings.stiffness,
      dragForce: joint.settings.dragForce,
      gravityPower: joint.settings.gravityPower,
    })
  })
}

/**
 * Apply preset configurations
 */
export const SPRING_BONE_PRESETS = {
  /**
   * No physics at all - completely static
   */
  static: {
    disableAllPhysics: true,
  },

  /**
   * Disable bust physics, allow others
   */
  noBust: {
    disableBustPhysics: true,
    disableAllPhysics: false,
    reduceStiffness: false,
  },

  /**
   * Gentle reduction for all bones
   */
  gentle: {
    disableBustPhysics: true,
    disableAllPhysics: false,
    reduceStiffness: true,
    stiffnessMultiplier: 1.5,
    dragMultiplier: 1.3,
  },

  /**
   * Moderate reduction
   */
  moderate: {
    disableBustPhysics: true,
    disableAllPhysics: false,
    reduceStiffness: true,
    stiffnessMultiplier: 2.5,
    dragMultiplier: 2.0,
  },

  /**
   * Heavy reduction - minimal movement
   */
  heavy: {
    disableBustPhysics: true,
    disableAllPhysics: false,
    reduceStiffness: true,
    stiffnessMultiplier: 5.0,
    dragMultiplier: 4.0,
  },
} as const

/**
 * Apply a preset configuration
 */
export function applySpringBonePreset(vrm: VRM, preset: keyof typeof SPRING_BONE_PRESETS): void {
  const options = SPRING_BONE_PRESETS[preset]
  stabilizeSpringBones(vrm, options)
}
