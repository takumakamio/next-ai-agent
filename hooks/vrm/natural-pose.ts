import { useCallback, useRef } from 'react'

export const useNaturalPose = (vrmModel: any) => {
  const lastPoseApplicationRef = useRef<number>(0)

  const applyNaturalPose = useCallback(() => {
    if (!vrmModel.vrmRef.current?.humanoid) return

    // Throttle pose application to avoid conflicts with animations
    const now = Date.now()
    if (now - lastPoseApplicationRef.current < 100) return
    lastPoseApplicationRef.current = now

    try {
      const humanoid = vrmModel.vrmRef.current.humanoid
      console.log('🎭 Applying natural pose to prevent T-pose')

      // Natural arm positions
      const armBones = [
        { name: 'rightUpperArm', rotation: [0, 0, -0.3] as [number, number, number] },
        { name: 'leftUpperArm', rotation: [0, 0, 0.3] as [number, number, number] },
        { name: 'rightLowerArm', rotation: [0, 0, -0.2] as [number, number, number] },
        { name: 'leftLowerArm', rotation: [0, 0, 0.2] as [number, number, number] },
      ]

      armBones.forEach(({ name, rotation }) => {
        const bone = humanoid.getNormalizedBoneNode(name)
        if (bone) {
          bone.rotation.set(...rotation)
        }
      })

      // Natural spine and head positions
      const spine = humanoid.getNormalizedBoneNode('spine')
      if (spine) {
        spine.rotation.set(0.05, 0, 0)
      }

      const head = humanoid.getNormalizedBoneNode('head')
      if (head) {
        head.rotation.set(0.1, 0, 0)
      }

      // Natural leg positions
      const legBones = [
        { name: 'rightUpperLeg', rotation: [0, 0, 0.05] as [number, number, number] },
        { name: 'leftUpperLeg', rotation: [0, 0, -0.05] as [number, number, number] },
      ]

      legBones.forEach(({ name, rotation }) => {
        const bone = humanoid.getNormalizedBoneNode(name)
        if (bone) {
          bone.rotation.set(...rotation)
        }
      })

      console.log('✅ Natural pose applied successfully')
    } catch (error) {
      console.error('Error applying natural pose:', error)
    }
  }, [vrmModel.vrmRef])

  // Enhanced pose application that works as fallback during animation gaps
  const applyEmergencyPose = useCallback(() => {
    if (!vrmModel.vrmRef.current?.humanoid) return

    try {
      const humanoid = vrmModel.vrmRef.current.humanoid

      // Quick emergency pose to prevent T-pose flashing
      const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
      const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')

      if (rightUpperArm) rightUpperArm.rotation.z = -0.3
      if (leftUpperArm) leftUpperArm.rotation.z = 0.3
    } catch (error) {
      console.error('Error applying emergency pose:', error)
    }
  }, [vrmModel.vrmRef])

  return { applyNaturalPose, applyEmergencyPose }
}
