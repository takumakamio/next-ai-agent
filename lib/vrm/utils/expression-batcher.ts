import type { VRMExpressionManager } from '@pixiv/three-vrm'

/**
 * Expression Batcher - Optimizes expression updates
 * Based on Amica's pattern of batching expression changes to reduce overhead
 */

export interface ExpressionUpdate {
  name: string
  value: number
  priority?: number
}

export interface ExpressionBatcherConfig {
  updateInterval: number // ms
  maxBatchSize: number
  enablePriorityQueue: boolean
}

export class ExpressionBatcher {
  private pendingUpdates: Map<string, ExpressionUpdate> = new Map()
  private lastUpdateTime = 0
  private config: ExpressionBatcherConfig
  private expressionManager: VRMExpressionManager | null = null
  private updateTimer: number | null = null

  constructor(config: ExpressionBatcherConfig) {
    this.config = config
  }

  /**
   * Set the expression manager to use
   */
  public setExpressionManager(manager: VRMExpressionManager | null): void {
    this.expressionManager = manager
  }

  /**
   * Queue an expression update
   */
  public queueUpdate(name: string, value: number, priority = 0): void {
    // If immediate update is needed (high priority), apply directly
    if (priority > 10 && this.expressionManager) {
      try {
        this.expressionManager.setValue(name, value)
      } catch (error) {
        console.warn(`Failed to set expression ${name}:`, error)
      }
      return
    }

    // Queue the update
    this.pendingUpdates.set(name, { name, value, priority })

    // If batch is full or interval elapsed, flush immediately
    if (
      this.pendingUpdates.size >= this.config.maxBatchSize ||
      Date.now() - this.lastUpdateTime > this.config.updateInterval
    ) {
      this.flush()
    } else if (!this.updateTimer) {
      // Schedule a flush
      this.updateTimer = window.setTimeout(() => {
        this.flush()
      }, this.config.updateInterval)
    }
  }

  /**
   * Flush all pending updates to the expression manager
   */
  public flush(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }

    if (!this.expressionManager || this.pendingUpdates.size === 0) {
      return
    }

    try {
      // Sort by priority if enabled
      const updates = Array.from(this.pendingUpdates.values())

      if (this.config.enablePriorityQueue) {
        updates.sort((a, b) => (b.priority || 0) - (a.priority || 0))
      }

      // Apply all updates
      for (const update of updates) {
        try {
          this.expressionManager.setValue(update.name, update.value)
        } catch (error) {
          console.warn(`Failed to set expression ${update.name}:`, error)
        }
      }

      // Clear pending updates
      this.pendingUpdates.clear()
      this.lastUpdateTime = Date.now()
    } catch (error) {
      console.error('Error flushing expression updates:', error)
    }
  }

  /**
   * Reset a specific expression
   */
  public reset(name: string): void {
    this.pendingUpdates.delete(name)
    if (this.expressionManager) {
      try {
        this.expressionManager.setValue(name, 0)
      } catch (error) {
        console.warn(`Failed to reset expression ${name}:`, error)
      }
    }
  }

  /**
   * Reset all expressions
   */
  public resetAll(): void {
    this.pendingUpdates.clear()
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.resetAll()
    this.expressionManager = null
  }
}

/**
 * Expression smoothing utility for natural transitions
 */
export class ExpressionSmoother {
  private targetValues: Map<string, number> = new Map()
  private currentValues: Map<string, number> = new Map()
  private smoothingFactor: number

  constructor(smoothingFactor = 0.2) {
    this.smoothingFactor = smoothingFactor
  }

  /**
   * Set target expression value
   */
  public setTarget(name: string, value: number): void {
    this.targetValues.set(name, value)
    if (!this.currentValues.has(name)) {
      this.currentValues.set(name, 0)
    }
  }

  /**
   * Update current values towards targets (call this each frame)
   */
  public update(delta: number): Map<string, number> {
    const updates = new Map<string, number>()

    for (const [name, target] of this.targetValues.entries()) {
      const current = this.currentValues.get(name) || 0

      // Lerp towards target
      const speed = this.smoothingFactor * (60 * delta) // Adjust for frame rate
      const newValue = current + (target - current) * Math.min(speed, 1)

      this.currentValues.set(name, newValue)
      updates.set(name, newValue)
    }

    return updates
  }

  /**
   * Reset smoothing
   */
  public reset(): void {
    this.targetValues.clear()
    this.currentValues.clear()
  }

  /**
   * Get current value
   */
  public getCurrent(name: string): number {
    return this.currentValues.get(name) || 0
  }
}

/**
 * Blinking controller for natural eye movements
 */
export class BlinkController {
  private lastBlinkTime = 0
  private nextBlinkTime = 0
  private isBlinking = false
  private blinkProgress = 0
  private blinkDuration = 150 // ms
  private minInterval: number
  private maxInterval: number

  constructor(minInterval = 2000, maxInterval = 6000) {
    this.minInterval = minInterval
    this.maxInterval = maxInterval
    this.scheduleNextBlink()
  }

  /**
   * Schedule the next blink
   */
  private scheduleNextBlink(): void {
    const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval)
    this.nextBlinkTime = Date.now() + interval
  }

  /**
   * Update blink state and return blink intensity
   */
  public update(): number {
    const now = Date.now()

    // Check if it's time to blink
    if (!this.isBlinking && now >= this.nextBlinkTime) {
      this.isBlinking = true
      this.lastBlinkTime = now
      this.blinkProgress = 0
    }

    // Update blink progress
    if (this.isBlinking) {
      this.blinkProgress = (now - this.lastBlinkTime) / this.blinkDuration

      if (this.blinkProgress >= 1) {
        this.isBlinking = false
        this.blinkProgress = 0
        this.scheduleNextBlink()
        return 0
      }

      // Smooth blink curve (ease in-out)
      const t = this.blinkProgress
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      return eased
    }

    return 0
  }

  /**
   * Force a blink
   */
  public forceBlink(): void {
    this.isBlinking = true
    this.lastBlinkTime = Date.now()
    this.blinkProgress = 0
  }

  /**
   * Reset blink state
   */
  public reset(): void {
    this.isBlinking = false
    this.blinkProgress = 0
    this.scheduleNextBlink()
  }
}
