import { type AIResponse, type Message, useAvatar } from '@/hooks/avatar'
import { Play, Square, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'

export const MessagesList = (): JSX.Element => {
  const t = useTranslations()
  const { currentMessage } = useAvatar()
  const messages = useAvatar((state) => state.messages) as Message[]
  const clearAll = useAvatar((state) => state.clearAll)
  const playMessage = useAvatar((state) => state.playMessage)
  const stopMessage = useAvatar((state) => state.stopMessage)

  const container = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState('normal')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  useEffect(() => {
    if (container.current) {
      const scrollContainer = container.current
      const scrollToBottom = () => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        })
      }

      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length])

  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem('ai-agent-font-size')
      if (savedFontSize && ['small', 'normal', 'large'].includes(savedFontSize)) {
        setFontSize(savedFontSize)
      }
    } catch (error) {
      console.warn('Could not load font size from localStorage:', error)
    }
  }, [])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showLanguageDropdown && !target.closest('[data-language-dropdown]')) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageDropdown])

  const handleAudioControl = useCallback(
    (message: Message, action: 'play' | 'stop') => {
      if (action === 'play') {
        playMessage(message)
        announceToScreenReader(t('NowPlaying', { question: message.question }))
      } else {
        stopMessage(message)
        announceToScreenReader(t('AudioStopped'))
      }
    },
    [playMessage, stopMessage, t],
  )

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement)
      }
    }, 1000)
  }

  const handleClearHistory = useCallback(() => {
    clearAll()

    try {
      localStorage.removeItem('ai-agent-conversation-log')
      localStorage.removeItem('ai-agent-conversation-history')
      localStorage.removeItem('ai-agent-messages')
    } catch (error) {
      console.warn('Could not clear localStorage conversation data:', error)
    }

    announceToScreenReader(t('AllHistoryCleared'))
  }, [clearAll, t])

  const renderRecommendation = useCallback(
    (recommendation: AIResponse): JSX.Element => {
      return (
        <div className="space-y-4">
          <h3
            className={`
              font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary/90 to-foreground/90
              ${fontSize === 'large' ? 'text-3xl md:text-4xl' : fontSize === 'small' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}
            `}
          >
            {recommendation.title}
          </h3>

          <p
            className={`
              text-foreground/90 leading-relaxed
              ${fontSize === 'large' ? 'text-xl md:text-2xl' : fontSize === 'small' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}
            `}
          >
            {recommendation.description}
          </p>
        </div>
      )
    },
    [fontSize],
  )

  const getBoardDimensions = () => {
    const baseClass = 'mx-auto'
    return `${baseClass} h-[300px] md:h-[800px] lg:h-[700px]`
  }

  return (
    <>
      <div
        className={`${getBoardDimensions()} flex flex-col`}
        role="log"
        aria-label={t('AIResponsesAndConversations')}
        aria-live="polite"
      >
        {/* Accessibility controls and conversation history */}
        <div className="flex flex-wrap gap-2 p-2 border-b-2 border-border/40 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="font-size-select" className="text-foreground/70 text-xs">
              {t('TextSize')}:
            </label>
            <select
              id="font-size-select"
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value)
                try {
                  localStorage.setItem('ai-agent-font-size', e.target.value)
                } catch (error) {
                  console.warn('Could not save font size to localStorage:', error)
                }
              }}
              className="bg-muted/80 backdrop-blur-sm text-foreground border border-border px-2 py-1 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="small">{t('Small')}</option>
              <option value="normal">{t('Normal')}</option>
              <option value="large">{t('Large')}</option>
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 px-2 py-1 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              title={t('ClearAllConversationHistoryAndMessages')}
            >
              <Trash2 className="w-3 h-3" />
              {t('ClearAll')}
            </button>
          )}
        </div>

        {/* Messages container */}
        <div
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 focus:outline-none"
          ref={container}
          aria-label={t('AIResponsesList')}
        >
          {messages.length === 0 && (
            <div className="h-full w-full grid place-content-center text-center">
              <h2
                className={`
                  font-bold text-foreground/90 italic
                  ${fontSize === 'large' ? 'text-4xl md:text-6xl lg:text-7xl' : fontSize === 'small' ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-3xl md:text-5xl lg:text-6xl'}
                `}
              >
                {t('WelcomeTo')}
              </h2>
              <h2
                className={`
                  font-bold text-primary/90 italic mt-2
                  ${fontSize === 'large' ? 'text-4xl md:text-6xl lg:text-7xl' : fontSize === 'small' ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-3xl md:text-5xl lg:text-6xl'}
                `}
              >
                {t('AppName')}
              </h2>
              <p
                className={`
                  text-muted-foreground mt-4
                  ${fontSize === 'large' ? 'text-xl md:text-2xl' : fontSize === 'small' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}
                `}
              >
                {t('YourPersonalAIAssistant')}
              </p>
            </div>
          )}

          {messages.map((message: any, i) => (
            <article
              key={message.id || i}
              className="border border-border/30 rounded-lg p-4 md:p-6 bg-muted/30 backdrop-blur-sm"
              aria-labelledby={`message-${i}-title`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-grow">
                  {/* Message header */}
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-4">
                    <span
                      className={`
                        bg-primary px-3 py-1 text-primary-foreground font-bold uppercase rounded
                        ${fontSize === 'large' ? 'text-base md:text-lg' : fontSize === 'small' ? 'text-xs md:text-sm' : 'text-sm md:text-base'}
                      `}
                    >
                      {t('Question')}
                    </span>
                    <span
                      id={`message-${i}-title`}
                      className={`
                        text-accent
                        ${fontSize === 'large' ? 'text-base' : fontSize === 'small' ? 'text-xs' : 'text-sm'}
                      `}
                    >
                      {message.question}
                    </span>
                  </div>

                  {message.answer && renderRecommendation(message.answer)}

                  {/* Render websiteLink QR code if it exists */}
                  {message.answer?.websiteLink && (
                    <div className="mt-4">
                      <div className="bg-white p-2 border border-border rounded-lg inline-block">
                        <QRCodeSVG value={message.answer.websiteLink} size={64} level="M" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio controls */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  {currentMessage === message ? (
                    <button
                      className="p-2 text-foreground/65 hover:text-foreground focus:ring-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                      onClick={() => handleAudioControl(message, 'stop')}
                      aria-label={t('StopPlayingMessage', { question: message.question })}
                    >
                      <Square className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      className="p-2 text-foreground/65 hover:text-foreground focus:ring-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleAudioControl(message, 'play')}
                      aria-label={t('PlayAudioForMessage', { question: message.question })}
                    >
                      <Play className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
