import type { AnimationAction, AnimationMixer } from 'three'

/**
 * Animation Pool - Memory-efficient animation management
 * Inspired by Amica's object pooling pattern
 * Reduces garbage collection overhead by reusing animation actions
 */

export interface PooledAnimationAction {
  action: AnimationAction
  inUse: boolean
  lastUsed: number
}

export interface AnimationPoolConfig {
  maxPoolSize: number
  disposeUnusedAfter: number // ms
  enableAutoCleanup: boolean
}

export class AnimationPool {
  private pool: Map<string, PooledAnimationAction[]> = new Map()
  private config: AnimationPoolConfig
  private cleanupInterval: number | null = null

  constructor(config: AnimationPoolConfig) {
    this.config = config

    if (config.enableAutoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * Get or create an animation action
   */
  public getAction(mixer: AnimationMixer, clipName: string, clip: any): AnimationAction | null {
    // Check if we have a pooled action for this clip
    const pooledActions = this.pool.get(clipName) || []

    // Try to find an unused action
    for (const pooled of pooledActions) {
      if (!pooled.inUse) {
        pooled.inUse = true
        pooled.lastUsed = Date.now()
        console.log(`♻️ Reusing pooled action: ${clipName}`)
        return pooled.action
      }
    }

    // Create new action if pool not full
    if (pooledActions.length < this.config.maxPoolSize) {
      const action = mixer.clipAction(clip)

      const pooled: PooledAnimationAction = {
        action,
        inUse: true,
        lastUsed: Date.now(),
      }

      pooledActions.push(pooled)
      this.pool.set(clipName, pooledActions)

      console.log(`🆕 Created new pooled action: ${clipName} (${pooledActions.length}/${this.config.maxPoolSize})`)
      return action
    }

    // Pool is full, create non-pooled action
    console.warn(`⚠️ Pool full for ${clipName}, creating non-pooled action`)
    return mixer.clipAction(clip)
  }

  /**
   * Release an action back to the pool
   */
  public releaseAction(clipName: string, action: AnimationAction): void {
    const pooledActions = this.pool.get(clipName)
    if (!pooledActions) return

    for (const pooled of pooledActions) {
      if (pooled.action === action) {
        // Stop and reset the action
        pooled.action.stop()
        pooled.action.reset()
        pooled.action.enabled = false
        pooled.inUse = false
        pooled.lastUsed = Date.now()
        console.log(`🔄 Released action to pool: ${clipName}`)
        break
      }
    }
  }

  /**
   * Clean up unused actions
   */
  public cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [clipName, pooledActions] of this.pool.entries()) {
      const filtered = pooledActions.filter((pooled) => {
        const shouldKeep = pooled.inUse || now - pooled.lastUsed < this.config.disposeUnusedAfter

        if (!shouldKeep) {
          // Properly dispose of the action
          pooled.action.stop()
          cleanedCount++
        }

        return shouldKeep
      })

      if (filtered.length === 0) {
        this.pool.delete(clipName)
      } else {
        this.pool.set(clipName, filtered)
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} unused animation actions`)
    }
  }

  /**
   * Start automatic cleanup
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup()
    }, 30000) // Run every 30 seconds
  }

  /**
   * Stop automatic cleanup
   */
  private stopAutoCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    totalActions: number
    inUseActions: number
    pooledClips: number
  } {
    let totalActions = 0
    let inUseActions = 0

    for (const pooledActions of this.pool.values()) {
      totalActions += pooledActions.length
      inUseActions += pooledActions.filter((p) => p.inUse).length
    }

    return {
      totalActions,
      inUseActions,
      pooledClips: this.pool.size,
    }
  }

  /**
   * Clear the entire pool
   */
  public clear(): void {
    for (const pooledActions of this.pool.values()) {
      for (const pooled of pooledActions) {
        pooled.action.stop()
      }
    }

    this.pool.clear()
    console.log('🗑️ Animation pool cleared')
  }

  /**
   * Dispose of the pool
   */
  public dispose(): void {
    this.stopAutoCleanup()
    this.clear()
  }
}

/**
 * Animation cache for storing loaded animation clips
 */
export class AnimationCache {
  private cache: Map<string, any> = new Map()
  private accessTimes: Map<string, number> = new Map()
  private maxCacheSize: number

  constructor(maxCacheSize = 50) {
    this.maxCacheSize = maxCacheSize
  }

  /**
   * Get a cached animation clip
   */
  public get(key: string): any | null {
    const clip = this.cache.get(key)
    if (clip) {
      this.accessTimes.set(key, Date.now())
    }
    return clip || null
  }

  /**
   * Add an animation clip to the cache
   */
  public set(key: string, clip: any): void {
    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      this.removeLRU()
    }

    this.cache.set(key, clip)
    this.accessTimes.set(key, Date.now())
  }

  /**
   * Check if a clip is cached
   */
  public has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Remove least recently used item
   */
  private removeLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Number.POSITIVE_INFINITY

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.accessTimes.delete(oldestKey)
      console.log(`🗑️ Removed LRU animation from cache: ${oldestKey}`)
    }
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; maxSize: number; utilizationPercent: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.cache.size / this.maxCacheSize) * 100,
    }
  }
}

/**
 * Memory monitor for tracking VRM memory usage
 */
export class VRMMemoryMonitor {
  private samples: number[] = []
  private maxSamples = 60 // Keep last 60 samples

  /**
   * Take a memory sample
   */
  public sample(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      if (memory && memory.usedJSHeapSize) {
        this.samples.push(memory.usedJSHeapSize)

        // Keep only recent samples
        if (this.samples.length > this.maxSamples) {
          this.samples.shift()
        }
      }
    }
  }

  /**
   * Get average memory usage
   */
  public getAverage(): number {
    if (this.samples.length === 0) return 0
    const sum = this.samples.reduce((a, b) => a + b, 0)
    return sum / this.samples.length
  }

  /**
   * Get memory trend (positive = increasing, negative = decreasing)
   */
  public getTrend(): number {
    if (this.samples.length < 2) return 0

    const recent = this.samples.slice(-10)
    const older = this.samples.slice(-20, -10)

    if (older.length === 0) return 0

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    return recentAvg - olderAvg
  }

  /**
   * Check if memory is increasing rapidly (potential leak)
   */
  public isMemoryLeaking(): boolean {
    const trend = this.getTrend()
    const threshold = 10 * 1024 * 1024 // 10MB

    return trend > threshold
  }

  /**
   * Get memory statistics
   */
  public getStats(): {
    current: number
    average: number
    trend: number
    isLeaking: boolean
  } {
    return {
      current: this.samples[this.samples.length - 1] || 0,
      average: this.getAverage(),
      trend: this.getTrend(),
      isLeaking: this.isMemoryLeaking(),
    }
  }

  /**
   * Reset the monitor
   */
  public reset(): void {
    this.samples = []
  }
}
