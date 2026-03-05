import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TextInput } from '@/features/root/home/components/text-input'
import { AI_MODEL_OPTIONS, AVATAR_MODELS, type AiModel, type ModelFormat, type TtsEngine } from '@/hooks/avatar'
import { useAvatar } from '@/hooks/avatar'
import { LANGUAGES } from '@/i18n/routing'
import { VOICEVOX_SPEAKERS } from '@/lib/tts/voicevox'
import { type Locale, useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { QaListModal } from '../../qas/components/list-modal'

const VOICEVOX_SPEAKER_OPTIONS = [
  { id: VOICEVOX_SPEAKERS.ZUNDAMON.NORMAL, labelKey: 'SpeakerZundamon' },
  { id: VOICEVOX_SPEAKERS.SHIKOKU_METAN.NORMAL, labelKey: 'SpeakerShikokuMetan' },
  { id: VOICEVOX_SPEAKERS.KASUKABE_TSUMUGI.NORMAL, labelKey: 'SpeakerTsumugi' },
  { id: VOICEVOX_SPEAKERS.NAMINE_RITSU.NORMAL, labelKey: 'SpeakerRitsu' },
] as const

const TTS_ENGINE_OPTIONS: { value: TtsEngine; labelKey: string }[] = [
  { value: 'auto', labelKey: 'TTSEngineAuto' },
  { value: 'elevenlabs', labelKey: 'TTSEngineElevenLabs' },
  { value: 'gemini', labelKey: 'TTSEngineGemini' },
  { value: 'voicevox', labelKey: 'TTSEngineVoicevox' },
]

export const Menus = () => {
  const askAI = useAvatar((state) => state.askAI)
  const loading = useAvatar((state) => state.loading)
  const recording = useAvatar((state) => state.recording)
  const isSpeaking = useAvatar((state) => state.isSpeaking)
  const startVoiceInput = useAvatar((state) => state.startVoiceInput)
  const stopVoiceInput = useAvatar((state) => state.stopVoiceInput)
  const ttsEngine = useAvatar((state) => state.ttsEngine)
  const ttsSpeakerId = useAvatar((state) => state.ttsSpeakerId)
  const setTtsEngine = useAvatar((state) => state.setTtsEngine)
  const setTtsSpeakerId = useAvatar((state) => state.setTtsSpeakerId)
  const aiModel = useAvatar((state) => state.aiModel)
  const setAiModel = useAvatar((state) => state.setAiModel)
  const modelFormat = useAvatar((state) => state.modelFormat)
  const setModelFormat = useAvatar((state) => state.setModelFormat)

  const locale = useLocale()
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [isTypingBoxVisible, setIsTypingBoxVisible] = useState(false)
  const [isQAListModalOpen, setIsQAListModalOpen] = useState(false)
  const [voiceInputError, setVoiceInputError] = useState<string | null>(null)
  const [wasRecording, setWasRecording] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(locale as Locale)

  // Update current language when locale changes
  useEffect(() => {
    setCurrentLanguage(locale as Locale)
  }, [locale])

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

  const handleLanguageChange = useCallback(
    (language: Locale) => {
      try {
        // Set locale cookie
        document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=${60 * 60 * 24 * 365}`
        setCurrentLanguage(language)

        // Clear avatar messages
        const clearMessages = useAvatar.getState().clearMessages
        if (clearMessages) clearMessages()

        announceToScreenReader(
          `Language changed to ${LANGUAGES.find((l) => l.code === language)?.name}. Chat history has been reset.`,
        )

        // Reload the current page to apply locale from cookie
        startTransition(() => {
          window.location.reload()
        })
      } catch (error) {
        console.error('Failed to change language:', error)
      }
    },
    [startTransition],
  )

  // Cycle to next language
  const handleLanguageButtonClick = useCallback(() => {
    const currentIndex = LANGUAGES.findIndex((l) => l.code === currentLanguage)
    const nextIndex = (currentIndex + 1) % LANGUAGES.length
    handleLanguageChange(LANGUAGES[nextIndex].code)
  }, [currentLanguage, handleLanguageChange])

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

  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage)

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
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            voiceInputError={voiceInputError}
            onVoiceInputErrorDismiss={handleVoiceInputErrorDismiss}
            isVisible={isTypingBoxVisible}
            onClose={handleCloseTypingBox}
            wasRecording={wasRecording}
            isPending={isPending}
          />

          {/* Horizontal Menu Bar */}
          <div className="flex rounded-xl border border-border bg-card/90 backdrop-blur-md dmp-shadow">
            {/* AI Model */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${menuButtonClass} w-28 h-36 bg-secondary rounded-l-xl border-r border-border/40 hover:bg-secondary/80`}
                  disabled={loading || isSpeaking}
                  aria-label={t('AIModel')}
                  title={isSpeaking ? 'Avatar is speaking...' : t('AIModel')}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm1.61-9.96c-2.06-.3-3.88.97-4.43 2.79-.18.58.26 1.17.87 1.17h.2c.41 0 .74-.29.88-.67.32-.89 1.27-1.5 2.3-1.28.95.2 1.65 1.13 1.57 2.1-.1 1.34-1.62 1.63-2.45 2.88 0 .01-.01.01-.01.02-.01.02-.02.03-.03.05-.09.15-.18.32-.25.5-.01.03-.03.05-.04.08-.01.02-.01.04-.02.07C10.07 14.22 10 14.58 10 15h2c0-.31.05-.59.15-.85.09-.23.2-.44.34-.63.02-.02.03-.04.05-.06.38-.53.97-1.02 1.58-1.39.09-.06.18-.11.27-.17.39-.26.76-.52 1.06-.9.72-.88.94-2.07.56-3.16-.47-1.34-1.77-2.36-3.4-2.6z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    {t(AI_MODEL_OPTIONS.find((o) => o.value === aiModel)?.labelKey as any)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>{t('AIModel')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={aiModel} onValueChange={(value) => setAiModel(value as AiModel)}>
                  {AI_MODEL_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey as any)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3D Model Format */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${menuButtonClass} w-28 h-36 bg-secondary border-r border-border/40 hover:bg-secondary/80`}
                  disabled={loading || isSpeaking}
                  aria-label={t('ThreeDModel')}
                  title={isSpeaking ? 'Avatar is speaking...' : t('ThreeDModel')}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    {modelFormat.toUpperCase()}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>{t('ThreeDModel')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={modelFormat}
                  onValueChange={(value) => setModelFormat(value as ModelFormat)}
                >
                  {AVATAR_MODELS.map((model) => (
                    <DropdownMenuRadioItem key={`${model.avatar}-${model.format}`} value={model.format}>
                      {model.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* TTS Engine */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`${menuButtonClass} w-28 h-36 bg-secondary border-r border-border/40 hover:bg-secondary/80`}
                  disabled={loading || isSpeaking}
                  aria-label={t('TTSEngine')}
                  title={isSpeaking ? 'Avatar is speaking...' : t('TTSEngine')}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    {t(TTS_ENGINE_OPTIONS.find((o) => o.value === ttsEngine)?.labelKey as any)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>{t('TTSEngine')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={ttsEngine}
                  onValueChange={(value) => {
                    setTtsEngine(value as TtsEngine)
                    if (value !== 'voicevox') {
                      setTtsSpeakerId(undefined)
                    } else if (ttsSpeakerId === undefined) {
                      setTtsSpeakerId(VOICEVOX_SPEAKERS.ZUNDAMON.NORMAL)
                    }
                  }}
                >
                  {TTS_ENGINE_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey as any)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {ttsEngine === 'voicevox' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('TTSSpeaker')}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={String(ttsSpeakerId ?? VOICEVOX_SPEAKERS.ZUNDAMON.NORMAL)}
                      onValueChange={(value) => setTtsSpeakerId(Number(value))}
                    >
                      {VOICEVOX_SPEAKER_OPTIONS.map((speaker) => (
                        <DropdownMenuRadioItem key={speaker.id} value={String(speaker.id)}>
                          {t(speaker.labelKey as any)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language */}
            <button
              onClick={handleLanguageButtonClick}
              className={`${menuButtonClass} w-28 h-36 bg-primary border-r border-border/40 hover:bg-primary/80`}
              disabled={loading || isPending || isSpeaking}
              aria-label={`Change language. Current: ${currentLang?.name}`}
              title={isSpeaking ? 'Avatar is speaking...' : `Change language. Current: ${currentLang?.name}`}
            >
              <span className="text-4xl">{currentLang?.flag}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                {currentLang?.code.toUpperCase()}
              </span>
            </button>

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
                {recording ? t('MenuButtonStop') : t('MenuButtonTalk')}
              </span>
            </button>

            {/* Text Input */}
            <button
              onClick={handleTextInputButton}
              className={`${menuButtonClass} w-28 h-36 border-r border-border/40 ${
                isTypingBoxVisible ? 'bg-primary hover:bg-primary/80' : 'bg-muted hover:bg-muted/80'
              }`}
              disabled={loading || isSpeaking}
              aria-label={t('MenuButtonType')}
              aria-pressed={isTypingBoxVisible}
              title={isSpeaking ? 'Avatar is speaking...' : t('MenuButtonType')}
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
                {t('MenuButtonType')}
              </span>
            </button>

            {/* Q&A */}
            <button
              onClick={handleQAListButton}
              className={`${menuButtonClass} w-28 h-36 bg-muted rounded-r-xl hover:bg-muted/80`}
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
                {t('MenuButtonFAQ')}
              </span>
            </button>
          </div>
        </div>
      </div>

      <QaListModal isOpen={isQAListModalOpen} onClose={handleCloseQAListModal} />
    </>
  )
}
