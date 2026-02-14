import { LANGUAGES, type Language } from '@/i18n/routing'
import { BookOpen, ChevronDown, ChevronUp, Code, MapPin, Plus, Send, Settings, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TextInputProps {
  onSubmit: (question: string) => void
  loading: boolean
  recording: boolean
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
  voiceInputError: string | null
  onVoiceInputErrorDismiss: () => void
  isVisible: boolean
  onClose: () => void
  wasRecording: boolean
  isPending?: boolean
}

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  loading,
  recording,
  currentLanguage,
  onLanguageChange,
  voiceInputError,
  onVoiceInputErrorDismiss,
  isVisible,
  onClose,
  wasRecording,
}) => {
  const t = useTranslations()
  const [question, setQuestion] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [characterCount, setCharacterCount] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const MAX_CHARACTERS = 500

  // Enhanced quick suggestions with better categorization
  const quickSuggestions = [
    {
      icon: <Code className="w-3 h-3" />,
      text: t('ShowBestPractices'),
      category: t('Programming'),
      keywords: 'best practices coding clean code patterns',
    },
    {
      icon: <BookOpen className="w-3 h-3" />,
      text: t('ShowLearningRoadmap'),
      category: t('Learning'),
      keywords: 'learning roadmap study path curriculum',
    },
    {
      icon: <Settings className="w-3 h-3" />,
      text: t('DebuggingTips'),
      category: t('Debugging'),
      keywords: 'debugging troubleshooting error fixing',
    },
    {
      icon: <Code className="w-3 h-3" />,
      text: t('CodingConventions'),
      category: t('Architecture'),
      keywords: 'coding conventions style guide standards',
    },
    {
      icon: <Settings className="w-3 h-3" />,
      text: t('HowToSetupCICD'),
      category: t('DevOps'),
      keywords: 'ci cd pipeline deployment infrastructure',
    },
    {
      icon: <BookOpen className="w-3 h-3" />,
      text: t('RecommendLibrary'),
      category: t('Libraries'),
      keywords: 'library framework package recommendation',
    },
  ]

  // Update character count when question changes
  useEffect(() => {
    setCharacterCount(question.length)
  }, [question])

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
    if (isDrawerOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isVisible, isDrawerOpen])

  // Auto-collapse when recording stops (only if recording was actually active)
  useEffect(() => {
    if (wasRecording && !recording && isDrawerOpen && question.trim()) {
      // Recording just stopped and we have text - auto collapse after delay
      const timer = setTimeout(() => {
        setIsDrawerOpen(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [recording, wasRecording, isDrawerOpen, question])

  // Auto-collapse when loading starts (question submitted)
  useEffect(() => {
    if (loading) {
      setIsDrawerOpen(false)
      setShowSuggestions(false)
    }
  }, [loading])

  const ask = useCallback(() => {
    if (!question.trim() || loading) return

    // Auto-collapse drawer when submitting
    setIsDrawerOpen(false)
    setShowSuggestions(false)

    onSubmit(question.trim())
    setQuestion('')
    setCharacterCount(0)
    setSelectedSuggestionIndex(-1)

    // Announce to screen readers
    const announcement = t('AskingAbout', { question: question.trim() })
    announceToScreenReader(announcement)
  }, [question, loading, onSubmit, t])

  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      setQuestion(suggestionText)
      setCharacterCount(suggestionText.length)
      setShowSuggestions(false)
      textareaRef.current?.focus()
      announceToScreenReader(t('SelectedSuggestion', { suggestion: suggestionText }))
    },
    [t],
  )

  const handleCloseTypingBox = useCallback(() => {
    setIsDrawerOpen(false)
    setShowSuggestions(false)
    setQuestion('')
    setCharacterCount(0)
    onClose()
    announceToScreenReader(t('TypingBoxClosed'))
  }, [onClose, t])

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(quickSuggestions[selectedSuggestionIndex].text)
          setSelectedSuggestionIndex(-1)
        } else {
          ask()
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < quickSuggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : prev))
      } else if (e.key === 'Escape') {
        setSelectedSuggestionIndex(-1)
        setIsDrawerOpen(false)
        setShowSuggestions(false)
        onClose()
      }
    },
    [selectedSuggestionIndex, quickSuggestions, ask, handleSuggestionClick, onClose],
  )

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

  // Input validation
  const isInputValid = question.trim().length > 0 && question.length <= MAX_CHARACTERS
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.8

  const buttonClass = `
    rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `

  if (!isVisible) return null

  return (
    <div className="flex-1 mr-4 animate-in slide-in-from-left duration-300">
      {/* Compact Input Bar */}
      <div className="rounded-full shadow-lg border bg-muted/30 backdrop-blur-md border-border/40">
        <div className="flex items-center p-3 gap-3">
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`${buttonClass} p-2 bg-muted/30 hover:bg-muted/50 text-foreground flex-shrink-0`}
            aria-label={isDrawerOpen ? t('CollapseDrawer') : t('ExpandDrawer')}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? <ChevronDown className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>

          {/* Compact Input */}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground border-none outline-none px-2 py-1 text-sm"
            placeholder={t('AskAI')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={MAX_CHARACTERS}
            aria-describedby="char-count voice-error input-help"
            aria-invalid={!isInputValid && question.length > 0}
          />

          {/* Status indicator */}
          {(loading || recording) && (
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              {loading && (
                <>
                  <div className="w-3 h-3 border border-border/50 border-t-white rounded-full animate-spin" />
                  <span>{t('Processing')}</span>
                </>
              )}
              {recording && (
                <>
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                  <span>{t('Recording')}</span>
                </>
              )}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={ask}
            disabled={loading || !isInputValid}
            className={`${buttonClass} p-2 bg-primary/80 hover:bg-primary focus:ring-primary text-primary-foreground flex-shrink-0`}
            aria-label={t('SendMessage')}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-border/50 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={handleCloseTypingBox}
            className={`${buttonClass} p-2 bg-muted/30 hover:bg-muted/50 text-foreground flex-shrink-0`}
            aria-label={t('CloseTypingBox')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character Counter and Errors (compact view) */}
        {(question || voiceInputError) && (
          <div className="px-4 pb-2 space-y-1">
            {question && (
              <div className="text-xs text-muted-foreground text-right">
                <span className={isNearLimit ? 'text-yellow-300' : ''}>
                  {characterCount}/{MAX_CHARACTERS}
                </span>
              </div>
            )}
            {voiceInputError && (
              <div className="text-xs text-red-300 text-center bg-red-500/20 rounded px-2 py-1">
                {voiceInputError}
                <button
                  onClick={onVoiceInputErrorDismiss}
                  className="ml-2 text-red-200 hover:text-foreground"
                  aria-label={t('DismissError')}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Drawer */}
      {isDrawerOpen && (
        <div
          ref={drawerRef}
          className="mt-2 rounded-t-xl shadow-lg border-t border-x bg-muted/30 backdrop-blur-md border-border/40 transition-all duration-300 ease-out"
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-medium text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {t('WhatCanIHelpYouPlanToday')}
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                aria-label={t('CloseDrawer')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-xs">{t('AskMeAnythingDescription')}</p>

            {/* Language Selection in Drawer */}
            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {t('Language')}
              </div>
              <div className="flex border-2 border-border/50 p-0.5 gap-0.5 bg-muted/40">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                      currentLanguage === lang.code
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                    disabled={loading}
                  >
                    {lang.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Suggestions Toggle */}
            <div className="space-y-2">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`${buttonClass} flex items-center justify-between w-full p-2 bg-muted/20 hover:bg-muted/30 rounded-lg text-foreground text-sm`}
                aria-expanded={showSuggestions}
                aria-controls="suggestions-panel"
              >
                <span>{t('QuickSuggestions')}</span>
                {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Compact Suggestions Grid */}
              {showSuggestions && (
                <div id="suggestions-panel" className="grid grid-cols-1 gap-1" aria-label={t('SuggestionOptions')}>
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className={`
                        flex items-center gap-2 p-2 text-left text-foreground text-xs rounded transition-colors
                        focus:outline-none focus:ring-2 focus:ring-white/80
                        ${
                          selectedSuggestionIndex === index
                            ? 'bg-primary/30 ring-2 ring-primary/50'
                            : 'bg-muted/20 hover:bg-muted/30'
                        }
                        transition-all duration-200
                      `}
                      disabled={loading}
                      aria-selected={selectedSuggestionIndex === index}
                      tabIndex={selectedSuggestionIndex === index ? 0 : -1}
                    >
                      <span aria-hidden="true">{suggestion.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{suggestion.text}</div>
                      </div>
                      <div className="text-muted-foreground/60 text-xs">{suggestion.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice input error display */}
            {voiceInputError && (
              <div
                id="voice-error"
                className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm"
                role="alert"
              >
                {voiceInputError}
                <button
                  onClick={onVoiceInputErrorDismiss}
                  className="ml-2 text-red-200 hover:text-foreground"
                  aria-label={t('DismissError')}
                >
                  <X className="w-4 h-4 inline" />
                </button>
              </div>
            )}

            {/* Enhanced Input Area (when expanded) */}
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                className="w-full text-foreground placeholder:text-muted-foreground border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/80 focus:border-ring/50 disabled:opacity-50 disabled:cursor-not-allowed bg-muted/20 border-border/30"
                placeholder={t('TypeYourQuestionPlaceholder')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                maxLength={MAX_CHARACTERS}
                disabled={loading}
                aria-describedby="char-count voice-error input-help"
                aria-invalid={!isInputValid && question.length > 0}
              />

              {/* Action Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span id="char-count" className={isNearLimit ? 'text-yellow-300' : ''} aria-live="polite">
                    {characterCount}/{MAX_CHARACTERS}
                  </span>
                  {!isInputValid && question.length > 0 && (
                    <span className="text-red-300" role="alert">
                      {question.length > MAX_CHARACTERS ? t('TooLong') : t('Required')}
                    </span>
                  )}
                  {question && (
                    <button
                      onClick={() => {
                        setQuestion('')
                        setCharacterCount(0)
                        textareaRef.current?.focus()
                      }}
                      className="text-muted-foreground hover:text-foreground/80 underline"
                      aria-label={t('ClearInput')}
                    >
                      {t('Clear')}
                    </button>
                  )}
                </div>

                <button
                  onClick={ask}
                  disabled={loading || !isInputValid}
                  className={`${buttonClass} px-4 py-2 text-primary-foreground text-sm rounded-lg flex items-center gap-2 font-medium bg-primary/80 hover:bg-primary focus:ring-primary disabled:opacity-50`}
                  aria-describedby="submit-help"
                >
                  {loading ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-border/50 border-t-white rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      {t('Planning')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      {t('AskAdvisor')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground/60 text-center space-y-1">
              <p>{t('TryAskingAboutHelpText')}</p>
              <p className="md:hidden">{t('TapSuggestionsHelpText')}</p>
            </div>

            {/* Screen reader only helper text */}
            <div id="input-help" className="sr-only">
              {t('TypeYourQuestionHelperText')}
            </div>
            <div id="submit-help" className="sr-only">
              {loading ? t('YourQuestionIsBeingProcessed') : t('SubmitYourQuestion')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
