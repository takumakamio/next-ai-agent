import { loadVRMAnimation } from '../load-vrm-animation'
import type { VRMAnimation } from '../vrm-animation'
import { type VRMAOptimizationOptions, getAnimationStats, optimizeVRMAnimation } from './vrma-optimizer'

/**
 * VRMA Cache - Amica-inspired animation caching system
 * Caches optimized animations in memory for instant reuse
 */

export interface VRMACacheEntry {
  animation: VRMAnimation
  url: string
  loadedAt: number
  lastAccessed: number
  accessCount: number
  optimized: boolean
}

export interface VRMACacheOptions {
  maxCacheSize: number
  enableOptimization: boolean
  optimizationOptions?: Partial<VRMAOptimizationOptions>
  preloadAnimations?: string[]
  enableStatistics: boolean
}

export const DEFAULT_VRMA_CACHE_OPTIONS: VRMACacheOptions = {
  maxCacheSize: 50,
  enableOptimization: true,
  optimizationOptions: undefined,
  preloadAnimations: undefined,
  enableStatistics: true,
}

export class VRMACache {
  private cache: Map<string, VRMACacheEntry> = new Map()
  private options: VRMACacheOptions
  private stats = {
    hits: 0,
    misses: 0,
    loads: 0,
    optimizations: 0,
    totalKeyframesBefore: 0,
    totalKeyframesAfter: 0,
  }

  constructor(options: Partial<VRMACacheOptions> = {}) {
    this.options = { ...DEFAULT_VRMA_CACHE_OPTIONS, ...options }
    console.log('🎬 VRMA Cache initialized with options:', this.options)
  }

  /**
   * Load and cache a VRMA animation
   */
  async load(url: string, forceReload = false): Promise<VRMAnimation | null> {
    // Check cache first
    if (!forceReload && this.cache.has(url)) {
      const entry = this.cache.get(url)!
      entry.lastAccessed = Date.now()
      entry.accessCount++
      this.stats.hits++

      console.log(`♻️ VRMA cache hit: ${url} (accessed ${entry.accessCount} times)`)
      return entry.animation
    }

    this.stats.misses++
    this.stats.loads++

    try {
      console.log(`📂 Loading VRMA: ${url}`)

      // Load animation
      const animation = await loadVRMAnimation(url)

      if (!animation) {
        console.warn(`⚠️ Failed to load VRMA: ${url}`)
        return null
      }

      // Get stats before optimization
      const statsBefore = this.options.enableStatistics ? getAnimationStats(animation) : null

      // Optimize if enabled
      let optimized = false
      if (this.options.enableOptimization) {
        optimizeVRMAnimation(animation, this.options.optimizationOptions)
        optimized = true
        this.stats.optimizations++

        if (statsBefore) {
          const statsAfter = getAnimationStats(animation)
          this.stats.totalKeyframesBefore += statsBefore.totalKeyframes
          this.stats.totalKeyframesAfter += statsAfter.totalKeyframes

          const reduction = Math.round((1 - statsAfter.totalKeyframes / statsBefore.totalKeyframes) * 100)
          console.log(
            `  ✓ Optimized: ${statsBefore.totalKeyframes} → ${statsAfter.totalKeyframes} keyframes (${reduction}% reduction)`,
          )
        }
      }

      // Add to cache
      const entry: VRMACacheEntry = {
        animation,
        url,
        loadedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        optimized,
      }

      this.cache.set(url, entry)

      // Check cache size and evict if necessary
      if (this.cache.size > this.options.maxCacheSize) {
        this.evictLRU()
      }

      console.log(`✅ VRMA cached: ${url}`)

      return animation
    } catch (error) {
      console.error(`❌ Error loading VRMA ${url}:`, error)
      return null
    }
  }

  /**
   * Preload multiple animations
   */
  async preloadAnimations(urls: string[]): Promise<void> {
    console.log(`🚀 Preloading ${urls.length} VRMA files...`)

    const promises = urls.map((url) => this.load(url))
    await Promise.all(promises)

    console.log(`✅ Preloaded ${urls.length} animations`)
  }

  /**
   * Get a cached animation
   */
  get(url: string): VRMAnimation | null {
    const entry = this.cache.get(url)

    if (entry) {
      entry.lastAccessed = Date.now()
      entry.accessCount++
      this.stats.hits++
      return entry.animation
    }

    this.stats.misses++
    return null
  }

  /**
   * Check if animation is cached
   */
  has(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * Remove animation from cache
   */
  remove(url: string): boolean {
    return this.cache.delete(url)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    console.log('🗑️ VRMA cache cleared')
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestUrl: string | null = null
    let oldestTime = Number.POSITIVE_INFINITY

    for (const [url, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestUrl = url
      }
    }

    if (oldestUrl) {
      this.cache.delete(oldestUrl)
      console.log(`🗑️ Evicted LRU animation: ${oldestUrl}`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hits: number
    misses: number
    hitRate: number
    loads: number
    optimizations: number
    totalKeyframesBefore: number
    totalKeyframesAfter: number
    averageReduction: number
  } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    const averageReduction =
      this.stats.totalKeyframesBefore > 0
        ? (1 - this.stats.totalKeyframesAfter / this.stats.totalKeyframesBefore) * 100
        : 0

    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      loads: this.stats.loads,
      optimizations: this.stats.optimizations,
      totalKeyframesBefore: this.stats.totalKeyframesBefore,
      totalKeyframesAfter: this.stats.totalKeyframesAfter,
      averageReduction,
    }
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats()

    console.log('📊 VRMA Cache Statistics:')
    console.log(`  Size: ${stats.size}/${stats.maxSize}`)
    console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)}% (${stats.hits} hits, ${stats.misses} misses)`)
    console.log(`  Loads: ${stats.loads}`)
    console.log(`  Optimizations: ${stats.optimizations}`)

    if (stats.totalKeyframesBefore > 0) {
      console.log(
        `  Keyframe Reduction: ${stats.totalKeyframesBefore} → ${stats.totalKeyframesAfter} (${stats.averageReduction.toFixed(2)}% average)`,
      )
    }
  }

  /**
   * Get all cached URLs
   */
  getCachedUrls(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache entries sorted by access frequency
   */
  getMostAccessed(limit = 10): Array<{ url: string; accessCount: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([url, entry]) => ({
        url,
        accessCount: entry.accessCount,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)

    return entries.slice(0, limit)
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      loads: 0,
      optimizations: 0,
      totalKeyframesBefore: 0,
      totalKeyframesAfter: 0,
    }
    console.log('📊 VRMA cache statistics reset')
  }
}

/**
 * Global VRMA cache instance
 */
let globalCache: VRMACache | null = null

/**
 * Get or create global VRMA cache
 */
export function getGlobalVRMACache(options?: Partial<VRMACacheOptions>): VRMACache {
  if (!globalCache) {
    globalCache = new VRMACache(options)
  }

  return globalCache
}

/**
 * Reset global cache
 */
export function resetGlobalVRMACache(): void {
  if (globalCache) {
    globalCache.clear()
    globalCache = null
  }
}
