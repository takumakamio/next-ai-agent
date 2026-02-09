/**
 * VRM Configuration - Inspired by Amica's configuration pattern
 * Centralizes all VRM-related settings for easier management and optimization
 */

export interface VRMConfig {
  // Model Loading
  modelPath: string
  animationPath: string
  useCompression: boolean
  maxTextureSize: number

  // Performance
  enableLOD: boolean
  lodDistances: number[]
  maxPolygons: {
    high: number
    medium: number
    low: number
  }

  // Animation
  animationSettings: {
    fadeDuration: number
    fadeOutDuration: number
    idleTimeout: number
    maxConcurrentAnimations: number
    enableAnimationCaching: boolean
  }

  // Expression
  expressionSettings: {
    updateInterval: number // ms
    batchUpdates: boolean
    maxExpressionIntensity: number
    enableBlinking: boolean
    blinkInterval: [number, number] // min, max in ms
  }

  // Lip Sync
  lipSyncSettings: {
    enabled: boolean
    sensitivity: number
    smoothing: number
    timeDomainDataLength: number
  }

  // Rendering
  renderSettings: {
    shadowQuality: 'off' | 'low' | 'medium' | 'high'
    enablePostProcessing: boolean
    pixelRatio: number
    antialias: boolean
  }

  // Memory Management
  memorySettings: {
    enablePooling: boolean
    maxPoolSize: number
    gcInterval: number // ms
    disposeUnusedAfter: number // ms
  }

  // Spring Bone Physics
  springBoneSettings: {
    disableBustPhysics: boolean
    disableAllPhysics: boolean
    reduceMovement: boolean
    stiffnessMultiplier: number
    dragMultiplier: number
  }

  // Preloading
  preloadSettings: {
    enabled: boolean
    strategy: 'sequential' | 'parallel' | 'priority'
    maxConcurrent: number
    priorityAvatars: string[]
  }
}

/**
 * Default configuration optimized for performance
 */
export const DEFAULT_VRM_CONFIG: VRMConfig = {
  modelPath: '/models',
  animationPath: '/animations',
  useCompression: true,
  maxTextureSize: 2048,

  enableLOD: true,
  lodDistances: [5, 10, 20],
  maxPolygons: {
    high: 50000,
    medium: 25000,
    low: 10000,
  },

  animationSettings: {
    fadeDuration: 0.5,
    fadeOutDuration: 1.0,
    idleTimeout: 10000,
    maxConcurrentAnimations: 3,
    enableAnimationCaching: true,
  },

  expressionSettings: {
    updateInterval: 16, // ~60fps
    batchUpdates: true,
    maxExpressionIntensity: 1.0,
    enableBlinking: true,
    blinkInterval: [2000, 6000],
  },

  lipSyncSettings: {
    enabled: true,
    sensitivity: 1.0,
    smoothing: 0.7,
    timeDomainDataLength: 2048,
  },

  renderSettings: {
    shadowQuality: 'medium',
    enablePostProcessing: false,
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2,
    antialias: true,
  },

  memorySettings: {
    enablePooling: true,
    maxPoolSize: 50,
    gcInterval: 30000,
    disposeUnusedAfter: 60000,
  },

  preloadSettings: {
    enabled: true,
    strategy: 'priority',
    maxConcurrent: 2,
    priorityAvatars: ['Tsumugi'],
  },

  springBoneSettings: {
    disableBustPhysics: true, // Prevent unwanted shaking
    disableAllPhysics: false,
    reduceMovement: true,
    stiffnessMultiplier: 2.0,
    dragMultiplier: 1.5,
  },
}

/**
 * Performance presets for different device capabilities
 */
export const VRM_PERFORMANCE_PRESETS = {
  high: {
    ...DEFAULT_VRM_CONFIG,
    maxTextureSize: 4096,
    enableLOD: false,
    renderSettings: {
      ...DEFAULT_VRM_CONFIG.renderSettings,
      shadowQuality: 'high' as const,
      enablePostProcessing: true,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2,
    },
    expressionSettings: {
      ...DEFAULT_VRM_CONFIG.expressionSettings,
      updateInterval: 8,
    },
  },

  medium: DEFAULT_VRM_CONFIG,

  low: {
    ...DEFAULT_VRM_CONFIG,
    maxTextureSize: 1024,
    enableLOD: true,
    renderSettings: {
      ...DEFAULT_VRM_CONFIG.renderSettings,
      shadowQuality: 'low' as const,
      enablePostProcessing: false,
      pixelRatio: 1,
      antialias: false,
    },
    expressionSettings: {
      ...DEFAULT_VRM_CONFIG.expressionSettings,
      updateInterval: 32,
      enableBlinking: false,
    },
    animationSettings: {
      ...DEFAULT_VRM_CONFIG.animationSettings,
      maxConcurrentAnimations: 1,
    },
    preloadSettings: {
      ...DEFAULT_VRM_CONFIG.preloadSettings,
      strategy: 'sequential' as const,
      maxConcurrent: 1,
    },
  },

  potato: {
    ...DEFAULT_VRM_CONFIG,
    maxTextureSize: 512,
    useCompression: true,
    enableLOD: true,
    maxPolygons: {
      high: 10000,
      medium: 5000,
      low: 2500,
    },
    renderSettings: {
      shadowQuality: 'off' as const,
      enablePostProcessing: false,
      pixelRatio: 1,
      antialias: false,
    },
    expressionSettings: {
      ...DEFAULT_VRM_CONFIG.expressionSettings,
      updateInterval: 64,
      batchUpdates: true,
      enableBlinking: false,
    },
    animationSettings: {
      ...DEFAULT_VRM_CONFIG.animationSettings,
      maxConcurrentAnimations: 1,
      enableAnimationCaching: false,
    },
    memorySettings: {
      ...DEFAULT_VRM_CONFIG.memorySettings,
      maxPoolSize: 20,
      gcInterval: 15000,
    },
    preloadSettings: {
      enabled: false,
      strategy: 'sequential' as const,
      maxConcurrent: 1,
      priorityAvatars: [],
    },
  },
} as const

/**
 * Get configuration based on device capabilities
 */
export function getOptimalVRMConfig(): VRMConfig {
  // Return default config during SSR
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return VRM_PERFORMANCE_PRESETS.medium
  }

  // Check device capabilities
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  if (!gl) {
    return VRM_PERFORMANCE_PRESETS.low
  }

  // Check WebGL capabilities
  const maxTextureSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE)
  const memory = (performance as any).memory

  // Detect performance tier
  if (maxTextureSize >= 8192 && (!memory || memory.jsHeapSizeLimit > 2000000000)) {
    return VRM_PERFORMANCE_PRESETS.high
  } else if (maxTextureSize >= 4096 && (!memory || memory.jsHeapSizeLimit > 1000000000)) {
    return VRM_PERFORMANCE_PRESETS.medium
  } else {
    return VRM_PERFORMANCE_PRESETS.low
  }
}

/**
 * Merge custom config with defaults
 */
export function mergeVRMConfig(custom: Partial<VRMConfig>): VRMConfig {
  return {
    ...DEFAULT_VRM_CONFIG,
    ...custom,
    animationSettings: {
      ...DEFAULT_VRM_CONFIG.animationSettings,
      ...custom.animationSettings,
    },
    expressionSettings: {
      ...DEFAULT_VRM_CONFIG.expressionSettings,
      ...custom.expressionSettings,
    },
    lipSyncSettings: {
      ...DEFAULT_VRM_CONFIG.lipSyncSettings,
      ...custom.lipSyncSettings,
    },
    renderSettings: {
      ...DEFAULT_VRM_CONFIG.renderSettings,
      ...custom.renderSettings,
    },
    memorySettings: {
      ...DEFAULT_VRM_CONFIG.memorySettings,
      ...custom.memorySettings,
    },
    preloadSettings: {
      ...DEFAULT_VRM_CONFIG.preloadSettings,
      ...custom.preloadSettings,
    },
    springBoneSettings: {
      ...DEFAULT_VRM_CONFIG.springBoneSettings,
      ...custom.springBoneSettings,
    },
  }
}
