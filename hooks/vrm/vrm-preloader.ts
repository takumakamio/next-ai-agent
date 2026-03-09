import { getOptimalVRMConfig, optimizeVRM } from '@/lib/vrm'
import { getGlobalVRMACache, stabilizeSpringBones } from '@/lib/vrm/utils'
import type { VRMAnimation } from '@/lib/vrm/vrm-animation'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'
import { useEffect, useRef, useState } from 'react'
import { type AnimationClip, AnimationMixer, type Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface PreloadedModelData {
  vrm: VRM
  vrmAnimations: { [key: string]: VRMAnimation }
  scene: Group
  animations: { [key: string]: AnimationClip }
  mixer: AnimationMixer
}

/** @deprecated Use PreloadedModelData instead */
export type PreloadedVRMData = PreloadedModelData

export interface VRMPreloaderState {
  preloadedModels: Map<string, PreloadedModelData>
  isPreloading: boolean
  preloadProgress: { [key: string]: number }
  preloadErrors: { [key: string]: string }
}

// Avatars to preload
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
  const preloadVRM = async (avatarName: string): Promise<PreloadedModelData | null> => {
    const key = avatarName
    console.log(`Starting VRM preload for: ${key}`)

    try {
      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [key]: 0 },
      }))

      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))

      const vrmPath = `/models/${avatarName}.vrm`

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
            const progressPercent = Math.round((progress.loaded / progress.total) * 30)
            setState((prev) => ({
              ...prev,
              preloadProgress: { ...prev.preloadProgress, [key]: progressPercent },
            }))
          },
          (error) => reject(error),
        )
      })

      if (abortControllerRef.current?.signal.aborted) return null

      // Apply optimizations
      const config = getOptimalVRMConfig()
      optimizeVRM(vrm, config, false)
      stabilizeSpringBones(vrm, config.springBoneSettings)

      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [key]: 30 },
      }))

      // Create animation mixer
      const animationMixer = new AnimationMixer(vrm.scene)

      // Preload animations
      const loadedAnimations: { [key: string]: AnimationClip } = {}
      const loadedVrmAnimations: { [key: string]: VRMAnimation } = {}

      for (let i = 0; i < ANIMATION_FILES.length; i++) {
        const file = ANIMATION_FILES[i]

        if (abortControllerRef.current?.signal.aborted) return null

        try {
          const vrmAnimation = await vrmaCache.load(`/animations/${file}`)

          if (vrmAnimation) {
            const animationName = file.replace('.vrma', '')
            const clip = vrmAnimation.createAnimationClip(vrm)
            clip.optimize()

            loadedAnimations[animationName] = clip
            loadedVrmAnimations[animationName] = vrmAnimation
          }
        } catch (error) {
          console.warn(`Failed to preload animation ${file}:`, error)
        }

        const animationProgress = Math.round(((i + 1) / ANIMATION_FILES.length) * 70)
        setState((prev) => ({
          ...prev,
          preloadProgress: { ...prev.preloadProgress, [key]: 30 + animationProgress },
        }))
      }

      console.log(`VRM preloaded: ${key}, animations: ${Object.keys(loadedAnimations).length}`)
      vrmaCache.printStats()

      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [key]: 100 },
      }))

      return {
        vrm,
        vrmAnimations: loadedVrmAnimations,
        scene: vrm.scene,
        animations: loadedAnimations,
        mixer: animationMixer,
      }
    } catch (error) {
      console.error(`Error preloading VRM ${key}:`, error)
      setState((prev) => ({
        ...prev,
        preloadErrors: {
          ...prev.preloadErrors,
          [key]: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
      return null
    }
  }

  // Preload all models
  const startPreloading = async () => {
    if (preloadStartedRef.current) return

    preloadStartedRef.current = true
    abortControllerRef.current = new AbortController()

    setState((prev) => ({ ...prev, isPreloading: true }))
    console.log('Starting model preloading process...')

    const preloadedModels = new Map<string, PreloadedModelData>()

    for (const avatar of AVATARS_TO_PRELOAD) {
      if (abortControllerRef.current?.signal.aborted) break

      const preloadedData = await preloadVRM(avatar)
      if (preloadedData) {
        preloadedModels.set(avatar, preloadedData)
        console.log(`${avatar} successfully preloaded and cached`)
      }
    }

    setState((prev) => ({
      ...prev,
      preloadedModels,
      isPreloading: false,
    }))

    console.log(`Preloading completed! ${preloadedModels.size}/${AVATARS_TO_PRELOAD.length} models loaded`)
  }

  // Get preloaded data for a specific avatar
  const getPreloadedData = (avatarName: string): PreloadedModelData | null => {
    const data = state.preloadedModels.get(avatarName)
    if (!data) return null

    return {
      vrm: data.vrm,
      vrmAnimations: { ...data.vrmAnimations },
      scene: data.scene,
      animations: { ...data.animations },
      mixer: data.mixer,
    }
  }

  // Check if a specific avatar is preloaded
  const isAvatarPreloaded = (avatarName: string): boolean => {
    return state.preloadedModels.has(avatarName)
  }

  // Cleanup function
  const cleanupPreloader = () => {
    console.log('Cleaning up model preloader...')

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    state.preloadedModels.forEach((data, key) => {
      if (data.mixer) {
        data.mixer.stopAllAction()
        data.mixer.uncacheRoot(data.mixer.getRoot())
      }

      const sceneToDispose = data.scene
      if (sceneToDispose) {
        sceneToDispose.traverse((obj: any) => {
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
