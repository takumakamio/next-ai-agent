import { useCallback } from 'react'
import { VRM_EXPRESSIONS } from './expression-manager'

const VISEME_TO_VRM_MAP: Record<string, string[]> = {
  '0': [VRM_EXPRESSIONS.NEUTRAL],
  '1': [VRM_EXPRESSIONS.AA, VRM_EXPRESSIONS.A],
  '2': [VRM_EXPRESSIONS.EE, VRM_EXPRESSIONS.E],
  '3': [VRM_EXPRESSIONS.IH, VRM_EXPRESSIONS.I],
  '4': [VRM_EXPRESSIONS.OH, VRM_EXPRESSIONS.O],
  '5': [VRM_EXPRESSIONS.OU, VRM_EXPRESSIONS.U],
}

export const useLipSyncHandler = (vrmModel: any, currentMessage: any, enableLipSync: boolean, isSpeaking: boolean) => {
  const applyLipSync = useCallback(() => {
    // GLB has no morph targets - lip sync is unavailable
    if (!isSpeaking || !enableLipSync || !currentMessage || !vrmModel.vrmRef.current?.expressionManager) {
      return
    }

    let lipSyncApplied = false

    // Viseme-based lip sync
    if (currentMessage.visemes && currentMessage.audioPlayer && currentMessage.visemes.length > 0) {
      const currentTime = currentMessage.audioPlayer.currentTime * 1000

      for (let i = 0; i < currentMessage.visemes.length; i++) {
        const viseme = currentMessage.visemes[i]
        const nextViseme = currentMessage.visemes[i + 1]

        if (currentTime >= viseme.time && (!nextViseme || currentTime < nextViseme.time)) {
          const expressions = VISEME_TO_VRM_MAP[viseme.type] || []

          for (const expr of expressions) {
            try {
              vrmModel.vrmRef.current.expressionManager.setValue(expr, 0.9)
              lipSyncApplied = true
              break
            } catch (e) {
              console.error('Error applying lip sync:', e)
            }
          }
          break
        }
      }
    }

    // Fallback procedural lip sync
    if (!lipSyncApplied) {
      const time = Date.now() / 300
      const mouthValue = Math.max(0, 0.5 + Math.sin(time) * 0.4)
      const shapes = ['aa', 'oh', 'ee']
      const currentShape = shapes[Math.floor(time / 3) % shapes.length]

      try {
        vrmModel.vrmRef.current.expressionManager.setValue(currentShape, mouthValue)
      } catch (e) {
        try {
          vrmModel.vrmRef.current.expressionManager.setValue('aa', mouthValue)
        } catch (e2) {
          // Silent fallback
        }
      }
    }
  }, [vrmModel.vrmRef, currentMessage, enableLipSync, isSpeaking])

  return applyLipSync
}
