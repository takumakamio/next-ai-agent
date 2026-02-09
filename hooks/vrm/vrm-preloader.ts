import { getOptimalVRMConfig, optimizeVRM } from '@/lib/vrm'
import { getGlobalVRMACache, stabilizeSpringBones } from '@/lib/vrm/utils'
import type { VRMAnimation } from '@/lib/vrm/vrm-animation'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'
import { useEffect, useRef, useState } from 'react'
import { type AnimationClip, AnimationMixer } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface PreloadedVRMData {
  vrm: VRM
  animations: { [key: string]: AnimationClip }
  vrmAnimations: { [key: string]: VRMAnimation }
  mixer: AnimationMixer
}

export interface VRMPreloaderState {
  preloadedModels: Map<string, PreloadedVRMData>
  isPreloading: boolean
  preloadProgress: { [avatar: string]: number }
  preloadErrors: { [avatar: string]: string }
}

// List of all avatars to preload
const AVATARS_TO_PRELOAD = ['Tsumugi']

// Animation files to preload for each VRM
const ANIMATION_FILES = [
  'dance.vrma',
  'greeting.vrma',
  'idleLoop.vrma',
  'modelPose.vrma',
  'peaceSign.vrma',
  'shoot.vrma',
  'showFullBody.vrma',
  'spin.vrma',
  'squat.vrma',
]

export function useVRMPreloader() {
  const [state, setState] = useState<VRMPreloaderState>({
    preloadedModels: new Map(),
    isPreloading: false,
    preloadProgress: {},
    preloadErrors: {},
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const preloadStartedRef = useRef(false)

  // Initialize VRMA cache with optimization enabled
  const vrmaCache = useRef(
    getGlobalVRMACache({
      maxCacheSize: 50,
      enableOptimization: true,
      enableStatistics: true,
    }),
  ).current

  // Preload a single VRM model with animations
  const preloadVRM = async (avatarName: string): Promise<PreloadedVRMData | null> => {
    console.log(`🚀 Starting preload for avatar: ${avatarName}`)

    try {
      // Update progress
      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [avatarName]: 0 },
      }))

      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))

      const vrmPath = `/models/${avatarName}.vrm`
      console.log(`📂 Preloading VRM from: ${vrmPath}`)

      // Load VRM with progress tracking
      const vrm = await new Promise<VRM>((resolve, reject) => {
        loader.load(
          vrmPath,
          (gltf) => {
            const vrm = gltf.userData.vrm as VRM
            if (vrm) {
              resolve(vrm)
            } else {
              reject(new Error('No VRM data found in GLTF'))
            }
          },
          (progress) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 30) // VRM is 30% of total
            setState((prev) => ({
              ...prev,
              preloadProgress: { ...prev.preloadProgress, [avatarName]: progressPercent },
            }))
          },
          (error) => {
            reject(error)
          },
        )
      })

      // Check if preloading was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log(`🚫 Preload aborted for ${avatarName}`)
        return null
      }

      console.log(`✅ VRM preloaded successfully: ${avatarName}`)

      // Apply optimizations to the loaded VRM
      const config = getOptimalVRMConfig()
      optimizeVRM(vrm, config, false)
      console.log(`🎨 VRM optimizations applied for ${avatarName}`)

      // Stabilize spring bones to prevent shaking
      stabilizeSpringBones(vrm, config.springBoneSettings)
      console.log(`🔧 Spring bones stabilized for ${avatarName}`)

      // Update progress after VRM load
      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [avatarName]: 30 },
      }))

      // Create animation mixer
      const animationMixer = new AnimationMixer(vrm.scene)

      // Preload animations
      const loadedAnimations: { [key: string]: AnimationClip } = {}
      const loadedVrmAnimations: { [key: string]: VRMAnimation } = {}

      console.log(`🎬 Preloading animations for ${avatarName}...`)

      for (let i = 0; i < ANIMATION_FILES.length; i++) {
        const file = ANIMATION_FILES[i]

        // Check if preloading was aborted
        if (abortControllerRef.current?.signal.aborted) {
          console.log(`🚫 Animation preload aborted for ${avatarName}`)
          return null
        }

        try {
          console.log(`📂 Preloading animation: /animations/${file}`)

          // Use VRMA cache for optimized loading
          const vrmAnimation = await vrmaCache.load(`/animations/${file}`)

          if (vrmAnimation) {
            const animationName = file.replace('.vrma', '')
            const clip = vrmAnimation.createAnimationClip(vrm)

            // Apply Three.js optimization
            clip.optimize()

            loadedAnimations[animationName] = clip
            loadedVrmAnimations[animationName] = vrmAnimation

            console.log(`✅ Animation preloaded and optimized: ${animationName}`)
          }
        } catch (error) {
          console.warn(`❌ Failed to preload animation ${file}:`, error)
        }

        // Update progress
        const animationProgress = Math.round(((i + 1) / ANIMATION_FILES.length) * 70) // Animations are 70% of total
        setState((prev) => ({
          ...prev,
          preloadProgress: { ...prev.preloadProgress, [avatarName]: 30 + animationProgress },
        }))
      }

      console.log(`📊 Total animations preloaded for ${avatarName}:`, Object.keys(loadedAnimations).length)

      // Print VRMA cache statistics
      vrmaCache.printStats()

      // Final progress update
      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [avatarName]: 100 },
      }))

      return {
        vrm,
        animations: loadedAnimations,
        vrmAnimations: loadedVrmAnimations,
        mixer: animationMixer,
      }
    } catch (error) {
      console.error(`💥 Error preloading VRM ${avatarName}:`, error)
      setState((prev) => ({
        ...prev,
        preloadErrors: {
          ...prev.preloadErrors,
          [avatarName]: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
      return null
    }
  }

  // Preload all VRM models
  const startPreloading = async () => {
    if (preloadStartedRef.current) {
      console.log('🚫 Preloading already started')
      return
    }

    preloadStartedRef.current = true
    abortControllerRef.current = new AbortController()

    setState((prev) => ({ ...prev, isPreloading: true }))
    console.log('🚀 Starting VRM preloading process...')

    const preloadedModels = new Map<string, PreloadedVRMData>()

    // Preload models sequentially to avoid overwhelming the system
    for (const avatar of AVATARS_TO_PRELOAD) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🚫 Preloading process aborted')
        break
      }

      const preloadedData = await preloadVRM(avatar)
      if (preloadedData) {
        preloadedModels.set(avatar, preloadedData)
        console.log(`✅ ${avatar} successfully preloaded and cached`)
      }
    }

    setState((prev) => ({
      ...prev,
      preloadedModels,
      isPreloading: false,
    }))

    console.log(`🎉 Preloading completed! ${preloadedModels.size}/${AVATARS_TO_PRELOAD.length} models loaded`)
  }

  // Get preloaded data for a specific avatar
  const getPreloadedData = (avatarName: string): PreloadedVRMData | null => {
    const data = state.preloadedModels.get(avatarName)
    if (!data) return null

    // Return a copy of the data to avoid conflicts when used by multiple components
    return {
      vrm: data.vrm, // VRM can be shared
      animations: { ...data.animations }, // Copy animations object
      vrmAnimations: { ...data.vrmAnimations }, // Copy vrmAnimations object
      mixer: data.mixer, // Original mixer (but each component creates its own)
    }
  }

  // Check if a specific avatar is preloaded
  const isAvatarPreloaded = (avatarName: string): boolean => {
    return state.preloadedModels.has(avatarName)
  }

  // Cleanup function
  const cleanupPreloader = () => {
    console.log('🧹 Cleaning up VRM preloader...')

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Dispose of preloaded resources
    state.preloadedModels.forEach((data, avatarName) => {
      console.log(`🗑️ Disposing preloaded data for ${avatarName}`)

      if (data.mixer) {
        data.mixer.stopAllAction()
        data.mixer.uncacheRoot(data.mixer.getRoot())
      }

      if (data.vrm?.scene) {
        data.vrm.scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((mat: any) => {
                if (mat.map) mat.map.dispose()
                if (mat.normalMap) mat.normalMap.dispose()
                if (mat.emissiveMap) mat.emissiveMap.dispose()
                mat.dispose()
              })
            } else {
              if (obj.material.map) obj.material.map.dispose()
              if (obj.material.normalMap) obj.material.normalMap.dispose()
              if (obj.material.emissiveMap) obj.material.emissiveMap.dispose()
              obj.material.dispose()
            }
          }
        })
      }
    })

    setState({
      preloadedModels: new Map(),
      isPreloading: false,
      preloadProgress: {},
      preloadErrors: {},
    })

    preloadStartedRef.current = false
  }

  // Start preloading on mount
  useEffect(() => {
    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      startPreloading()
    }, 100)

    return () => {
      clearTimeout(timer)
      cleanupPreloader()
    }
  }, [])

  return {
    ...state,
    getPreloadedData,
    isAvatarPreloaded,
    startPreloading,
    cleanupPreloader,
  }
}
