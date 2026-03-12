import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TextInput } from '@/features/home/components/text-input'
import { AI_MODEL_OPTIONS, type AiModel } from '@/hooks/avatar'
import { useAvatar } from '@/hooks/avatar'
import { useCallback, useEffect, useState } from 'react'
import { QaListModal } from '../../qas/components/list-modal'

export const Menus = () => {
  const askAI = useAvatar((state) => state.askAI)
  const loading = useAvatar((state) => state.loading)
  const recording = useAvatar((state) => state.recording)
  const isSpeaking = useAvatar((state) => state.isSpeaking)
  const startVoiceInput = useAvatar((state) => state.startVoiceInput)
  const stopVoiceInput = useAvatar((state) => state.stopVoiceInput)
  const aiModel = useAvatar((state) => state.aiModel)
  const setAiModel = useAvatar((state) => state.setAiModel)

  const [isTypingBoxVisible, setIsTypingBoxVisible] = useState(false)
  const [isQAListModalOpen, setIsQAListModalOpen] = useState(false)
  const [voiceInputError, setVoiceInputError] = useState<string | null>(null)
  const [wasRecording, setWasRecording] = useState(false)

  // Track recording state
  useEffect(() => {
    if (recording) {
      setWasRecording(true)
    } else if (wasRecording && !recording) {
      setWasRecording(false)
    }
  }, [recording, wasRecording])

  // Auto-hide typing box when loading starts
  useEffect(() => {
    if (loading) {
      setTimeout(() => {
        setIsTypingBoxVisible(false)
      }, 1000)
    }
  }, [loading])

  const handleVoiceButton = useCallback(async () => {
    try {
      setVoiceInputError(null)

      if (recording) {
        stopVoiceInput()
        announceToScreenReader('Voice recording stopped')
      } else {
        // Show typing box when voice button is pressed
        setIsTypingBoxVisible(true)

        // Check for microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true })
          startVoiceInput()
          announceToScreenReader('Voice recording started. Speak your question.')
        } else {
          throw new Error('Voice input not supported on this device')
        }
      }
    } catch (error) {
      console.error('Voice input error:', error)
      setVoiceInputError(error instanceof Error ? error.message : 'Voice input is not available')
      announceToScreenReader('Voice input failed. Please try typing your question instead.')
    }
  }, [recording, startVoiceInput, stopVoiceInput])

  const handleCloseTypingBox = useCallback(() => {
    setIsTypingBoxVisible(false)
    announceToScreenReader('Typing box closed')
  }, [])

  const handleSubmitQuestion = useCallback(
    (question: string) => {
      askAI(question)
    },
    [askAI],
  )

  const handleVoiceInputErrorDismiss = useCallback(() => {
    setVoiceInputError(null)
  }, [])

  const handleTextInputButton = useCallback(() => {
    setIsTypingBoxVisible((prev) => !prev)
  }, [])

  const handleQAListButton = useCallback(() => {
    setIsQAListModalOpen(true)
  }, [])

  const handleCloseQAListModal = useCallback(() => {
    setIsQAListModalOpen(false)
  }, [])

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const menuButtonClass =
    'group flex flex-col items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0'

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 transition-all duration-300">
        <div className="flex items-end gap-4">
          {/* Text Input Component */}
          <TextInput
            onSubmit={handleSubmitQuestion}
            loading={loading}
            recording={recording}
            voiceInputError={voiceInputError}
            onVoiceInputErrorDismiss={handleVoiceInputErrorDismiss}
            isVisible={isTypingBoxVisible}
            onClose={handleCloseTypingBox}
            wasRecording={wasRecording}
          />

          {/* Horizontal Menu Bar */}
          <div className="flex rounded-xl border border-border bg-card/90 backdrop-blur-md dmp-shadow">
            {/* AI Model */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${menuButtonClass} w-28 h-36 bg-secondary rounded-l-xl border-r border-border/40 hover:bg-secondary/80`}
                  disabled={loading || isSpeaking}
                  aria-label="AIモデル"
                  title={isSpeaking ? 'Avatar is speaking...' : 'AIモデル'}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm1.61-9.96c-2.06-.3-3.88.97-4.43 2.79-.18.58.26 1.17.87 1.17h.2c.41 0 .74-.29.88-.67.32-.89 1.27-1.5 2.3-1.28.95.2 1.65 1.13 1.57 2.1-.1 1.34-1.62 1.63-2.45 2.88 0 .01-.01.01-.01.02-.01.02-.02.03-.03.05-.09.15-.18.32-.25.5-.01.03-.03.05-.04.08-.01.02-.01.04-.02.07C10.07 14.22 10 14.58 10 15h2c0-.31.05-.59.15-.85.09-.23.2-.44.34-.63.02-.02.03-.04.05-.06.38-.53.97-1.02 1.58-1.39.09-.06.18-.11.27-.17.39-.26.76-.52 1.06-.9.72-.88.94-2.07.56-3.16-.47-1.34-1.77-2.36-3.4-2.6z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    {AI_MODEL_OPTIONS.find((o) => o.value === aiModel)?.label}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>{'AIモデル'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={aiModel} onValueChange={(value) => setAiModel(value as AiModel)}>
                  {AI_MODEL_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice (center, wider) */}
            <button
              onClick={handleVoiceButton}
              className={`${menuButtonClass} w-44 h-36 border-r border-border/40 ${
                recording ? 'bg-destructive animate-pulse' : 'bg-accent hover:bg-accent/80'
              }`}
              disabled={loading || isSpeaking}
              aria-label={recording ? 'Stop voice recording' : 'Start voice recording'}
              aria-pressed={recording}
              title={
                isSpeaking
                  ? 'Avatar is speaking...'
                  : recording
                    ? 'Click to stop recording'
                    : 'Click to start voice input'
              }
            >
              {recording ? (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="6" width="12" height="12" rx="1" fill="white" />
                </svg>
              ) : (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C10.34 2 9 3.34 9 5V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V5C15 3.34 13.66 2 12 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              <span
                className={`text-sm font-black uppercase tracking-widest ${recording ? 'text-destructive-foreground' : 'text-accent-foreground'}`}
              >
                {recording ? '停止' : '話す'}
              </span>
            </button>

            {/* Text Input */}
            <button
              onClick={handleTextInputButton}
              className={`${menuButtonClass} w-28 h-36 border-r border-border/40 ${
                isTypingBoxVisible ? 'bg-primary hover:bg-primary/80' : 'bg-muted hover:bg-muted/80'
              }`}
              disabled={loading || isSpeaking}
              aria-label="入力"
              aria-pressed={isTypingBoxVisible}
              title={isSpeaking ? 'Avatar is speaking...' : '入力'}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <rect x="5" y="14" width="14" height="2" rx="0.5" fill="currentColor" />
                <rect x="5" y="8" width="3" height="2" rx="0.5" fill="currentColor" />
                <rect x="10" y="8" width="3" height="2" rx="0.5" fill="currentColor" />
                <rect x="15" y="8" width="4" height="2" rx="0.5" fill="currentColor" />
              </svg>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${isTypingBoxVisible ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {'入力'}
              </span>
            </button>

            {/* Q&A */}
            <button
              onClick={handleQAListButton}
              className={`${menuButtonClass} w-28 h-36 bg-muted hover:bg-muted/80`}
              disabled={loading || isSpeaking}
              aria-label="View Q&A"
              title={isSpeaking ? 'Avatar is speaking...' : 'Click to view Q&A'}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                <text x="8" y="11" textAnchor="middle" fill="#121212" fontSize="7" fontWeight="bold">
                  Q
                </text>
                <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                <text x="16" y="19" textAnchor="middle" fill="#121212" fontSize="7" fontWeight="bold">
                  A
                </text>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {'QA'}
              </span>
            </button>

            {/* Docs */}
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={`${menuButtonClass} w-28 h-36 bg-muted rounded-r-xl hover:bg-muted/80`}
              aria-label="Open docs"
              title="Open training docs in new tab"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 11h8" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {'Docs'}
              </span>
            </a>
          </div>
        </div>
      </div>

      <QaListModal isOpen={isQAListModalOpen} onClose={handleCloseQAListModal} />
    </>
  )
}
