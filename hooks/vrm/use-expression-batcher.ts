import { getOptimalVRMConfig } from '@/lib/vrm/config'
import { BlinkController, ExpressionBatcher } from '@/lib/vrm/utils'
import { useEffect, useRef } from 'react'

/**
 * Hook for managing expression batching and blinking
 * Optimizes expression updates and provides natural blinking
 * Returns null batcher/blinkController for GLB models (no morph targets)
 */
export const useExpressionBatcher = (vrmModel: any, enableExpressions: boolean) => {
  const batcherRef = useRef<ExpressionBatcher | null>(null)
  const blinkControllerRef = useRef<BlinkController | null>(null)

  // Initialize batcher and blink controller (VRM only)
  useEffect(() => {
    // Skip for GLB - no expression manager available
    if (!enableExpressions || vrmModel.modelFormatRef?.current === 'glb') return

    const config = getOptimalVRMConfig()

    // Create expression batcher
    batcherRef.current = new ExpressionBatcher({
      updateInterval: config.expressionSettings.updateInterval,
      maxBatchSize: 10,
      enablePriorityQueue: config.expressionSettings.batchUpdates,
    })

    // Create blink controller if enabled
    if (config.expressionSettings.enableBlinking) {
      blinkControllerRef.current = new BlinkController(
        config.expressionSettings.blinkInterval[0],
        config.expressionSettings.blinkInterval[1],
      )
    }

    return () => {
      batcherRef.current?.dispose()
      batcherRef.current = null
      blinkControllerRef.current = null
    }
  }, [enableExpressions, vrmModel.modelFormatRef?.current])

  // Update expression manager when VRM changes
  useEffect(() => {
    if (vrmModel.vrmRef?.current?.expressionManager && batcherRef.current) {
      batcherRef.current.setExpressionManager(vrmModel.vrmRef.current.expressionManager)
    }
  }, [vrmModel.vrmRef?.current])

  return {
    batcher: batcherRef.current,
    blinkController: blinkControllerRef.current,
  }
}
