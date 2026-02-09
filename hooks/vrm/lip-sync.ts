import { LipSync } from '@/lib/vrm/lip-sync'
import { useCallback, useRef } from 'react'

export const useLipSync = (enableLipSync: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const lipSyncRef = useRef<LipSync | null>(null)

  const initializeAudio = useCallback(() => {
    if (enableLipSync && !audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContext()
        lipSyncRef.current = new LipSync(audioContextRef.current)
      } catch (error) {
        console.warn('Audio context initialization failed:', error)
        return false
      }
    }
    return true
  }, [enableLipSync])

  const cleanup = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }, [])

  return { audioContextRef, lipSyncRef, initializeAudio, cleanup }
}
