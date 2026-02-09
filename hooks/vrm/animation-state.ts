import { useRef, useState } from 'react'
import type { AnimationAction } from 'three'

export const ANIMATION_STATES = {
  IDLE: 'idleLoop',
  THINKING: 'modelPose',
  GREETING: 'greeting',
  EXPLAINING: 'showFullBody',
  POINTING: 'peaceSign',
  WELCOMING: 'dance',
  PRESENTING: 'spin',
  RECOMMENDING: 'squat',
  CONFIRMING: 'shoot',
} as const

export type AnimationState = keyof typeof ANIMATION_STATES

export const useAnimationState = () => {
  const currentActionRef = useRef<AnimationAction | null>(null)
  const currentAnimationStateRef = useRef<AnimationState>('THINKING')
  const [blink, setBlink] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [thinkingText, setThinkingText] = useState<string>('.')

  return {
    currentActionRef,
    currentAnimationStateRef,
    blink,
    setBlink,
    isSpeaking,
    setIsSpeaking,
    thinkingText,
    setThinkingText,
  }
}
