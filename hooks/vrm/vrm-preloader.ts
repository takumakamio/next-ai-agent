import type { ModelFormat } from '@/hooks/avatar'
import { getOptimalVRMConfig, optimizeVRM } from '@/lib/vrm'
import { getGlobalVRMACache, stabilizeSpringBones } from '@/lib/vrm/utils'
import type { VRMAnimation } from '@/lib/vrm/vrm-animation'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'
import { useEffect, useRef, useState } from 'react'
import { type AnimationClip, AnimationMixer, type Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface PreloadedModelData {
  format: ModelFormat
  vrm: VRM | null
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

// Models to preload (avatar + format combinations)
const MODELS_TO_PRELOAD: { avatar: string; format: ModelFormat }[] = [
  { avatar: 'Tsumugi', format: 'vrm' },
  { avatar: 'Tsumugi', format: 'glb' },
]

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

function getModelKey(avatar: string, format: ModelFormat): string {
  return `${avatar}-${format}`
}

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

  // Preload a GLB model (no VRM plugin, no spring bones, no VRMA animations)
  const preloadGLB = async (avatarName: string): Promise<PreloadedModelData | null> => {
    const key = getModelKey(avatarName, 'glb')
    console.log(`Starting GLB preload for: ${key}`)

    try {
      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [key]: 0 },
      }))

      const loader = new GLTFLoader()
      const glbPath = `/models/${avatarName}.glb`

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          glbPath,
          (gltf) => resolve(gltf),
          (progress) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 100)
            setState((prev) => ({
              ...prev,
              preloadProgress: { ...prev.preloadProgress, [key]: progressPercent },
            }))
          },
          (error) => reject(error),
        )
      })

      if (abortControllerRef.current?.signal.aborted) return null

      const scene = gltf.scene as Group
      const mixer = new AnimationMixer(scene)

      // Extract embedded animations
      const loadedAnimations: { [key: string]: AnimationClip } = {}
      for (const clip of gltf.animations as AnimationClip[]) {
        loadedAnimations[clip.name] = clip
      }

      console.log(`GLB preloaded: ${key}, animations: ${Object.keys(loadedAnimations).join(', ') || 'none'}`)

      setState((prev) => ({
        ...prev,
        preloadProgress: { ...prev.preloadProgress, [key]: 100 },
      }))

      return {
        format: 'glb',
        vrm: null,
        vrmAnimations: {},
        scene,
        animations: loadedAnimations,
        mixer,
      }
    } catch (error) {
      console.error(`Error preloading GLB ${key}:`, error)
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

  // Preload a single VRM model with animations
  const preloadVRM = async (avatarName: string): Promise<PreloadedModelData | null> => {
    const key = getModelKey(avatarName, 'vrm')
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
        format: 'vrm',
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

    for (const { avatar, format } of MODELS_TO_PRELOAD) {
      if (abortControllerRef.current?.signal.aborted) break

      const preloadedData = format === 'glb' ? await preloadGLB(avatar) : await preloadVRM(avatar)
      if (preloadedData) {
        const key = getModelKey(avatar, format)
        preloadedModels.set(key, preloadedData)
        console.log(`${key} successfully preloaded and cached`)
      }
    }

    setState((prev) => ({
      ...prev,
      preloadedModels,
      isPreloading: false,
    }))

    console.log(`Preloading completed! ${preloadedModels.size}/${MODELS_TO_PRELOAD.length} models loaded`)
  }

  // Get preloaded data for a specific avatar+format
  const getPreloadedData = (avatarName: string, format: ModelFormat = 'vrm'): PreloadedModelData | null => {
    const key = getModelKey(avatarName, format)
    const data = state.preloadedModels.get(key)
    if (!data) return null

    return {
      format: data.format,
      vrm: data.vrm,
      vrmAnimations: { ...data.vrmAnimations },
      scene: data.scene,
      animations: { ...data.animations },
      mixer: data.mixer,
    }
  }

  // Check if a specific avatar+format is preloaded
  const isAvatarPreloaded = (avatarName: string, format: ModelFormat = 'vrm'): boolean => {
    return state.preloadedModels.has(getModelKey(avatarName, format))
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
