import { StarRatingControl, TextAreaControl } from '@/components/controls'
import { Button, Form } from '@/components/ui'
import { submitQAFeedbackAction } from '@/features/root/qa-logs/actions/feedback-action'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mic, MicOff, Star, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface FeedbackDialogProps {
  isOpen: boolean
  logId: string
  onClose: () => void
  messageQuestion: string
}

export const FeedbackDialog = ({ isOpen, logId, onClose, messageQuestion }: FeedbackDialogProps): JSX.Element => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const t = useTranslations()

  const feedbackFormSchema = z.object({
    rating: z.number().min(1, t('PleaseSelectARating')).max(5),
    feedback: z.string().optional(),
  })

  type FV = z.infer<typeof feedbackFormSchema>

  const { execute: submitFeedback, isPending } = useAction(submitQAFeedbackAction, {
    onSuccess({ data }) {
      if (data?.success) {
        toast.success(t('FeedbackSubmittedSuccessfully'))
        handleClose()
      } else {
        toast.error(data?.message || t('FailedToSubmitFeedback'))
      }
    },
    onError(error) {
      toast.error(t('AnUnexpectedErrorOccurred'))
      console.error('Feedback submission error:', error)
    },
  })

  const form = useForm<FV>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: 0,
      feedback: '',
    },
    mode: 'onBlur',
  })

  const watchedFeedback = form.watch('feedback')

  const handleSubmit = useCallback(
    (values: FV) => {
      submitFeedback({
        logId,
        rating: values.rating,
        feedback: values.feedback?.trim() || undefined,
      })
    },
    [logId, submitFeedback],
  )

  const clearFeedback = useCallback(() => {
    form.setValue('feedback', '', { shouldValidate: true, shouldDirty: true })
  }, [form])

  const startVoiceInput = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error(t('BrowserDoesntSupportSpeechRecognition'))
      return
    }

    setIsRecording(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data)
      })

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

        const formData = new FormData()
        formData.append('audio', audioBlob)

        try {
          setIsProcessingVoice(true)
          const response = await fetch('/api/root/home/stt', {
            method: 'POST',
            body: formData,
          })

          const data: { text?: string; error?: string } = await response.json()

          if (data.text) {
            // Append the transcribed text to existing feedback
            const currentFeedback = form.getValues('feedback') || ''
            const newText = data.text
            const updatedFeedback = currentFeedback ? `${currentFeedback} ${newText}` : newText

            form.setValue('feedback', updatedFeedback, { shouldValidate: true, shouldDirty: true })
            toast.success(t('VoiceInputAddedToFeedback'))
          } else {
            toast.error(data.error || t('FailedToTranscribeVoiceInput'))
          }
        } catch (error) {
          console.error('Error processing voice input:', error)
          toast.error(t('ErrorProcessingVoiceInput'))
        } finally {
          setIsProcessingVoice(false)
          setIsRecording(false)
        }
      })

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      audioStreamRef.current = stream

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopVoiceInput()
        }
      }, 10000)
    } catch (error) {
      console.error('Error starting voice recording:', error)
      toast.error(t('ErrorAccessingMicrophone'))
      setIsRecording(false)
    }
  }, [form, t])

  const stopVoiceInput = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
    mediaRecorderRef.current = null
    audioStreamRef.current = null
  }, [])

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopVoiceInput()
    } else {
      startVoiceInput()
    }
  }, [isRecording, startVoiceInput, stopVoiceInput])

  // Clean up on unmount or dialog close
  const handleClose = useCallback(() => {
    if (isRecording) {
      stopVoiceInput()
    }
    form.reset()
    onClose()
  }, [isRecording, stopVoiceInput, form, onClose])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        rating: 0,
        feedback: '',
      })
    }
  }, [isOpen, form])

  if (!isOpen) return <></>

  const isDisabled = isPending || isProcessingVoice

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg dmp-shadow max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white font-black uppercase tracking-wider flex items-center gap-2">
            <Star className="w-5 h-5" />
            {t('RateThisResponse')}
          </h3>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white border-2 border-white/30 hover:border-white p-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={t('CloseFeedbackDialog')}
            disabled={isDisabled}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question preview */}
        <div className="mb-6 p-3 bg-white/10 border-2 border-white/20">
          <p className="text-slate-300 text-sm font-medium mb-1">{t('YourQuestion')}</p>
          <p className="text-white text-sm line-clamp-2">{messageQuestion}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Rating using StarRatingControl */}
            <div className="space-y-2 text-white ">
              <StarRatingControl<FV> fieldName="rating" label={t('HowHelpfulWasThisResponse')} max={5} />
            </div>

            {/* Feedback text with voice input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 text-sm font-medium">{t('AdditionalFeedbackOptional')}</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFeedback}
                    disabled={isDisabled || !watchedFeedback}
                    className="flex items-center gap-1 px-2 py-1 text-xs transition-colors bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title={t('ClearFeedbackText')}
                  >
                    <X className="w-3 h-3" />
                    {t('Clear')}
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isDisabled}
                    className={`
                      flex items-center gap-1 px-2 py-1 text-xs transition-colors
                      ${
                        isRecording
                          ? 'bg-destructive text-white hover:bg-destructive/90'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                    `}
                    title={isRecording ? t('StopVoiceInput') : t('StartVoiceInput')}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3 h-3" />
                        {t('Stop')}
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        {t('Voice')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {(isRecording || isProcessingVoice) && (
                <div className="p-2 bg-primary/20 border border-primary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${isRecording ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                    <span className="text-xs text-blue-300">
                      {isRecording && t('RecordingMaxTenSeconds')}
                      {isProcessingVoice && t('ProcessingVoiceInput')}
                    </span>
                  </div>
                </div>
              )}

              <TextAreaControl<FV>
                fieldName="feedback"
                placeholder={t('TellUsHowWeCanImprove')}
                rows={3}
                maxLength={500}
                disabled={isDisabled}
                className="bg-white/10 border-2 border-white/30 text-white placeholder-white/40 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDisabled}
                className="text-white border-2 border-white/30 hover:bg-white/10"
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isDisabled}
                className="bg-primary hover:bg-primary/90 text-white font-bold border border-primary/50 rounded-lg"
              >
                {isPending ? t('Submitting') : t('SubmitFeedback')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
