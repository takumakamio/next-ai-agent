import { useEffect, useRef } from 'react'

// Constants
export const VRM_EXPRESSIONS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  EXCITED: 'surprised',
  THOUGHTFUL: 'relaxed',
  CONCERNED: 'sad',
  ENTHUSIASTIC: 'happy',
  BLINK: 'blink',
  BLINK_LEFT: 'blinkLeft',
  BLINK_RIGHT: 'blinkRight',
  LOOK_UP: 'lookUp',
  LOOK_DOWN: 'lookDown',
  LOOK_LEFT: 'lookLeft',
  LOOK_RIGHT: 'lookRight',
  AA: 'aa',
  IH: 'ih',
  OU: 'ou',
  EE: 'ee',
  OH: 'oh',
  A: 'a',
  I: 'i',
  U: 'u',
  E: 'e',
  O: 'o',
} as const

const IDLE_EXPRESSIONS = [VRM_EXPRESSIONS.HAPPY, VRM_EXPRESSIONS.NEUTRAL, VRM_EXPRESSIONS.THOUGHTFUL]

export const useExpressionManager = (
  enableExpressions: boolean,
  loading: boolean,
  loadingTTS: boolean,
  isSpeaking: boolean,
  currentMessage: any,
  isInIdleMode: boolean,
  isVRM: boolean = true,
) => {
  // Start with neutral to avoid any expressions with closed eyes
  const currentExpressionRef = useRef<string>(VRM_EXPRESSIONS.NEUTRAL)

  useEffect(() => {
    // GLB has no morph targets, always return neutral
    if (!enableExpressions || !isVRM) return

    if (loading || loadingTTS) {
      currentExpressionRef.current = VRM_EXPRESSIONS.NEUTRAL
    } else if (isSpeaking) {
      currentExpressionRef.current = VRM_EXPRESSIONS.NEUTRAL
    } else if (currentMessage) {
      currentExpressionRef.current = VRM_EXPRESSIONS.HAPPY
    } else if (isInIdleMode) {
      const expressionIndex = Math.floor(Date.now() / 4000) % IDLE_EXPRESSIONS.length
      currentExpressionRef.current = IDLE_EXPRESSIONS[expressionIndex]
    } else {
      currentExpressionRef.current = VRM_EXPRESSIONS.NEUTRAL
    }
  }, [enableExpressions, loading, loadingTTS, isSpeaking, currentMessage, isInIdleMode, isVRM])

  return currentExpressionRef
}
