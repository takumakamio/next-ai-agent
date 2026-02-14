import { useAvatar } from '@/hooks/avatar'
import { DollarSign, Palette, Settings, User, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export const BoardSettings = () => {
  const t = useTranslations()
  const avatar = useAvatar((state) => state.avatar)
  const setAvatar = useAvatar((state) => state.setAvatar)
  const expertiseLevel = useAvatar((state) => state.expertiseLevel)
  const setExpertiseLevel = useAvatar((state) => state.setExpertiseLevel)
  const [isExpanded, setIsExpanded] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Detect user preferences
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    setReduceMotion(motionQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)

    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        triggerRef.current?.focus()
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  const avatars = [
    {
      id: 'Tsumugi',
      name: 'Tsumugi',
      specialty: t('EngineeringExpert'),
      flag: '💻',
      description: t('EngineeringAIAgent'),
    },
  ]

  const expertiseLevels = [
    {
      id: 'beginner',
      name: t('Beginner'),
      icon: '🌱',
      description: t('BeginnerFriendlyExplanations'),
    },
    {
      id: 'advanced',
      name: t('Advanced'),
      icon: '🚀',
      description: t('AdvancedTechnicalDetails'),
    },
    {
      id: 'fullstack',
      name: t('FullStack'),
      icon: '🔧',
      description: t('FullStackDevelopment'),
    },
    {
      id: 'specialist',
      name: t('Specialist'),
      icon: '🎯',
      description: t('DeepDiveSpecialist'),
    },
  ]

  const baseButtonClass = `
    w-full p-3 border-2 text-left
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
    disabled:opacity-50 disabled:cursor-not-allowed
    ${reduceMotion ? '' : 'transition-colors duration-200'}
  `

  const getButtonVariant = (isActive: boolean) => {
    return isActive
      ? 'bg-primary border border-primary text-white focus:ring-white'
      : 'bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:border-border focus:ring-white'
  }

  return (
    <>
      {/* Mobile-friendly trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          fixed top-4 right-4 z-30 p-3 dmp-shadow
          border border-border bg-card/80 backdrop-blur-sm text-white rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
          ${reduceMotion ? '' : 'transition-all duration-200 hover:scale-105'}
          md:hidden
        `}
        aria-label={isExpanded ? t('ClosePreferences') : t('OpenPreferences')}
        aria-expanded={isExpanded}
        aria-controls="preferences-panel"
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      </button>

      {/* Settings Panel */}
      <div
        ref={panelRef}
        id="preferences-panel"
        className={`
          fixed md:absolute top-16 md:top-0 right-4 md:-right-80 md:-bottom-12
          w-80 md:w-72 max-h-[calc(100vh-5rem)] md:max-h-none overflow-y-auto
          p-4 dmp-shadow z-20
          bg-card/80 backdrop-blur-sm border border-border rounded-lg
          ${isExpanded ? 'block' : 'hidden md:block'}
          ${reduceMotion ? '' : 'transition-all duration-300'}
        `}
        aria-labelledby="preferences-title"
        aria-modal="false"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            id="preferences-title"
            className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2"
          >
            <Palette className="w-5 h-5" aria-hidden="true" />
            {t('Preferences')}
          </h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="md:hidden p-1 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={t('ClosePreferencesPanel')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar Selection */}
        <fieldset className="mb-6">
          <legend className="text-white/80 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <User className="w-4 h-4" aria-hidden="true" />
            {t('YourAIAvatar')}
          </legend>
          <div className="space-y-2" role="radiogroup" aria-labelledby="avatar-legend">
            {avatars.map((adv) => (
              <button
                key={adv.id}
                className={`${baseButtonClass} ${getButtonVariant(avatar === adv.id)}`}
                onClick={() => setAvatar(adv.id as any)}
                aria-checked={avatar === adv.id}
                aria-describedby={`avatar-${adv.id}-desc`}
              >
                <div className="font-medium text-base flex items-center gap-2">
                  <span role="img" aria-label={t('Flag')}>
                    {adv.flag}
                  </span>
                  {adv.name}
                  {avatar === adv.id && <span className="sr-only">({t('Selected')})</span>}
                </div>
                <div id={`avatar-${adv.id}-desc`} className="text-sm opacity-75">
                  {adv.description}
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Expertise Level Selection */}
        <fieldset className="mb-6">
          <legend className="text-white/80 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" aria-hidden="true" />
            {t('ExpertiseLevel')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
            {expertiseLevels.map((style) => (
              <button
                key={style.id}
                className={`${baseButtonClass} ${getButtonVariant(expertiseLevel === style.id)} p-2`}
                onClick={() => setExpertiseLevel(style.id as any)}
                aria-checked={expertiseLevel === style.id}
                aria-describedby={`style-${style.id}-desc`}
              >
                <div className="font-medium text-sm flex items-center gap-1">
                  <span role="img" aria-hidden="true">
                    {style.icon}
                  </span>
                  {style.name}
                  {expertiseLevel === style.id && <span className="sr-only">({t('Selected')})</span>}
                </div>
                <div id={`style-${style.id}-desc`} className="text-xs opacity-75">
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Current Configuration Summary */}
        <div className="bg-black/30 border-2 border-white/20 p-3" aria-label={t('CurrentPreferencesSummary')}>
          <div className="text-sm">
            <div className="font-medium mb-2">{t('ActiveConfiguration')}:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('Avatar')}:</span>
                <span className="text-primary">
                  {avatars.find((adv) => adv.id === avatar)?.flag} {avatars.find((adv) => adv.id === avatar)?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('Style')}:</span>
                <span className="text-accent">
                  {expertiseLevels.find((style) => style.id === expertiseLevel)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility note for screen readers */}
        <div className="sr-only" aria-live="polite">
          {t('PreferencesPanelStatus', {
            status: isExpanded ? t('Open') : t('Closed'),
            avatar: avatars.find((adv) => adv.id === avatar)?.name || '',
            expertiseLevel: expertiseLevels.find((style) => style.id === expertiseLevel)?.name || '',
          })}
        </div>
      </div>

      {/* Mobile backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
