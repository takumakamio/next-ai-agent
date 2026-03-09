'use client'

import { useAvatar } from '@/hooks/avatar'
import { Brain, Loader2, Mic, Volume2 } from 'lucide-react'

import type React from 'react'

export const StateIndicator = () => {
  const recording = useAvatar((state) => state.recording)
  const loading = useAvatar((state) => state.loading)
  const loadingTTS = useAvatar((state) => state.loadingTTS)
  const isSpeaking = useAvatar((state) => state.isSpeaking)
  const stopVoiceInput = useAvatar((state) => state.stopVoiceInput)

  // Determine current state and message
  let stateMessage = ''
  let StateIcon: React.ComponentType<{ className?: string }> | null = null
  let iconClassName = ''
  let isActive = false

  if (recording) {
    stateMessage = '音声を録音中...'
    StateIcon = Mic
    iconClassName = 'animate-pulse'
    isActive = true
  } else if (loading) {
    stateMessage = '質問について考え中...'
    StateIcon = Brain
    iconClassName = 'animate-pulse'
    isActive = true
  } else if (loadingTTS) {
    stateMessage = '音声を準備中...'
    StateIcon = Loader2
    iconClassName = 'animate-spin'
    isActive = true
  } else if (isSpeaking) {
    stateMessage = '話し中...'
    StateIcon = Volume2
    iconClassName = 'animate-pulse'
    isActive = true
  }

  if (!isActive || !StateIcon) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl px-8 py-6 dmp-shadow animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-3">
          {/* Icon with animation */}
          <StateIcon className={`w-16 h-16 text-foreground ${iconClassName}`} />

          {/* State message */}
          <p className="text-foreground text-xl font-black uppercase tracking-wider text-center">{stateMessage}</p>

          {/* Loading dots animation */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>

          {/* Stop recording button - only shown when recording */}
          {recording && (
            <button
              onClick={stopVoiceInput}
              className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-wider border border-border rounded-lg px-6 py-3 dmp-shadow pointer-events-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="会話を停止"
            >
              {'会話を停止'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
